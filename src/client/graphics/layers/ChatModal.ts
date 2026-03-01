import { LitElement, html } from "lit";
import { customElement, query } from "lit/decorators.js";

import { PlayerType } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";

import quickChatData from "resources/QuickChat.json" with { type: "json" };
import { EventBus } from "../../../core/EventBus";
import { CloseViewEvent } from "../../InputHandler";
import { SendQuickChatEvent } from "../../Transport";
import { translateText } from "../../Utils";

export type QuickChatPhrase = {
  key: string;
  requiresPlayer: boolean;
};

export type QuickChatPhrases = Record<string, QuickChatPhrase[]>;

export const quickChatPhrases: QuickChatPhrases = quickChatData;

@customElement("chat-modal")
export class ChatModal extends LitElement {
  @query("o-modal") private modalEl!: HTMLElement & {
    open: () => void;
    close: () => void;
  };

  createRenderRoot() {
    return this;
  }

  private players: PlayerView[] = [];

  private playerSearchQuery: string = "";
  private customChatText: string = "";
  private previewText: string | null = null;
  private requiresPlayerSelection: boolean = false;
  private selectedCategory: string | null = null;
  private selectedPhraseText: string | null = null;
  private selectedPhraseTemplate: string | null = null;
  private selectedQuickChatKey: string | null = null;
  private selectedPlayer: PlayerView | null = null;

  private recipient: PlayerView;
  private sender: PlayerView;
  public eventBus: EventBus;

  public g: GameView;

  quickChatPhrases: Record<
    string,
    Array<{ text: string; requiresPlayer: boolean }>
  > = {
      help: [{ text: "Please give me troops!", requiresPlayer: false }],
      attack: [{ text: "Attack [P1]!", requiresPlayer: true }],
      defend: [{ text: "Defend [P1]!", requiresPlayer: true }],
      greet: [{ text: "Hello!", requiresPlayer: false }],
      misc: [{ text: "Let's go!", requiresPlayer: false }],
    };

  public categories = [
    { id: "help" },
    { id: "attack" },
    { id: "defend" },
    { id: "greet" },
    { id: "misc" },
    { id: "warnings" },
  ];

  private getPhrasesForCategory(categoryId: string) {
    return quickChatPhrases[categoryId] ?? [];
  }

  render() {
    return html`
      <o-modal title="${translateText("chat.title")}">
        <div class="chat-columns">
          <div class="chat-column">
            <div class="column-title">${translateText("chat.category")}</div>
            ${this.categories.map(
      (category) => html`
                <button
                  class="chat-option-button ${this.selectedCategory ===
          category.id
          ? "selected"
          : ""}"
                  @click=${() => this.selectCategory(category.id)}
                >
                  ${translateText(`chat.cat.${category.id}`)}
                </button>
              `,
    )}
          </div>

          ${this.selectedCategory
        ? html`
                <div class="chat-column">
                  <div class="column-title">
                    ${translateText("chat.phrase")}
                  </div>
                  <div class="phrase-scroll-area">
                    ${this.getPhrasesForCategory(this.selectedCategory).map(
          (phrase) => html`
                        <button
                          class="chat-option-button ${this
              .selectedPhraseText ===
              translateText(
                `chat.${this.selectedCategory}.${phrase.key}`,
              )
              ? "selected"
              : ""}"
                          @click=${() => this.selectPhrase(phrase)}
                        >
                          ${this.renderPhrasePreview(phrase)}
                        </button>
                      `,
        )}
                  </div>
                </div>
              `
        : null}
          ${this.requiresPlayerSelection || this.selectedPlayer
        ? html`
                <div class="chat-column">
                  <div class="column-title">
                    ${translateText("chat.player")}
                  </div>

                  <input
                    class="player-search-input"
                    type="text"
                    placeholder="${translateText("chat.search")}"
                    .value=${this.playerSearchQuery}
                    @input=${this.onPlayerSearchInput}
                  />

                  <div class="player-scroll-area">
                    ${this.getSortedFilteredPlayers().map(
          (player) => html`
                        <button
                          class="chat-option-button ${this.selectedPlayer ===
              player
              ? "selected"
              : ""}"
                          style="border: 2px solid ${player
              .territoryColor()
              .toHex()};"
                          @click=${() => this.selectPlayer(player)}
                        >
                          ${player.name()}
                        </button>
                      `,
        )}
                  </div>
                </div>
              `
        : null}
        </div>

        <div class="chat-preview">
          ${this.previewText
        ? translateText(this.previewText)
        : translateText("chat.build")}
        </div>
        
        <div class="custom-chat-input" style="padding: 10px; text-align: center;">
            <input 
                type="text" 
                placeholder="Or type a custom message here..." 
                style="width: 80%; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;"
                @input=${this.onCustomChatInput}
                @keydown=${this.onCustomChatKeydown}
                .value=${this.customChatText}
            />
        </div>

        <div class="chat-send">
          <button
            class="chat-send-button"
            @click=${this.sendChatMessage}
            ?disabled=${!this.previewText ||
      (this.requiresPlayerSelection && !this.selectedPlayer)}
          >
            ${translateText("chat.send")}
          </button>
        </div>
      </o-modal>
    `;
  }

  initEventBus(eventBus: EventBus) {
    this.eventBus = eventBus;
    eventBus.on(CloseViewEvent, (e) => {
      if (!this.hidden) {
        this.close();
      }
    });
  }

  private selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedPhraseText = null;
    this.previewText = null;
    this.requiresPlayerSelection = false;
    this.requestUpdate();
  }

  private selectPhrase(phrase: QuickChatPhrase) {
    this.selectedQuickChatKey = this.getFullQuickChatKey(
      this.selectedCategory!,
      phrase.key,
    );
    this.selectedPhraseTemplate = translateText(
      `chat.${this.selectedCategory}.${phrase.key}`,
    );
    this.selectedPhraseText = translateText(
      `chat.${this.selectedCategory}.${phrase.key}`,
    );
    this.previewText = `chat.${this.selectedCategory}.${phrase.key}`;
    this.requiresPlayerSelection = phrase.requiresPlayer;
    this.requestUpdate();
  }

  private renderPhrasePreview(phrase: { key: string }) {
    return translateText(`chat.${this.selectedCategory}.${phrase.key}`);
  }

  private selectPlayer(player: PlayerView) {
    if (this.previewText) {
      this.previewText =
        this.selectedPhraseTemplate?.replace("[P1]", player.name()) ?? null;
      this.selectedPlayer = player;
      this.requiresPlayerSelection = false;
      this.requestUpdate();
    }
  }

  private sendChatMessage() {
    console.log("Sent message:", this.previewText);
    console.log("Sender:", this.sender);
    console.log("Recipient:", this.recipient);
    console.log("Key:", this.selectedQuickChatKey);

    if (this.sender && this.recipient && this.selectedQuickChatKey) {
      this.eventBus.emit(
        new SendQuickChatEvent(
          this.recipient,
          this.selectedQuickChatKey,
          this.selectedPlayer?.id(),
        ),
      );
    }

    this.previewText = null;
    this.selectedCategory = null;
    this.requiresPlayerSelection = false;
    this.close();

    this.requestUpdate();
  }

  private onCustomChatInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.customChatText = target.value;

    if (this.customChatText.trim().length > 0) {
      this.previewText = this.customChatText;
      this.selectedQuickChatKey = `custom.${this.customChatText}`;
      // Automatically require a player selection if we're typing a custom message unless we already selected.
      if (!this.selectedPlayer) {
        this.requiresPlayerSelection = true;
      }
    } else {
      this.previewText = null;
      this.selectedQuickChatKey = null;
      if (!this.selectedCategory) {
        this.requiresPlayerSelection = false;
      }
    }

    this.requestUpdate();
  }

  private onCustomChatKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && this.customChatText.trim().length > 0) {
      // If they hit enter and we have a target, send it immediately
      if (this.selectedPlayer) {
        this.sendChatMessage();
      }
    }
  }

  private onPlayerSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.playerSearchQuery = target.value.toLowerCase();
    this.requestUpdate();
  }

  private getSortedFilteredPlayers(): PlayerView[] {
    const sorted = [...this.players].sort((a, b) =>
      a.name().localeCompare(b.name()),
    );
    const filtered = sorted.filter((p) =>
      p.name().toLowerCase().includes(this.playerSearchQuery),
    );
    const others = sorted.filter(
      (p) => !p.name().toLowerCase().includes(this.playerSearchQuery),
    );
    return [...filtered, ...others];
  }

  private getFullQuickChatKey(category: string, phraseKey: string): string {
    return `${category}.${phraseKey}`;
  }

  public open(sender?: PlayerView, recipient?: PlayerView) {
    if (sender && recipient) {
      console.log("Sent message:", recipient);
      console.log("Sent message:", sender);
      this.players = this.g
        .players()
        .filter((p) => p.isAlive() && p.data.playerType !== PlayerType.Bot);

      this.recipient = recipient;
      this.sender = sender;
    }
    this.requestUpdate();
    this.modalEl?.open();
  }

  public close() {
    this.selectedCategory = null;
    this.selectedPhraseText = null;
    this.previewText = null;
    this.customChatText = "";
    this.requiresPlayerSelection = false;
    this.modalEl?.close();
  }

  public setRecipient(value: PlayerView) {
    this.recipient = value;
  }

  public setSender(value: PlayerView) {
    this.sender = value;
  }

  public openWithSelection(
    categoryId: string,
    phraseKey: string,
    sender?: PlayerView,
    recipient?: PlayerView,
  ) {
    if (sender && recipient) {
      this.players = this.g
        .players()
        .filter((p) => p.isAlive() && p.data.playerType !== PlayerType.Bot);

      this.recipient = recipient;
      this.sender = sender;
    }

    this.selectCategory(categoryId);

    const phrase = this.getPhrasesForCategory(categoryId).find(
      (p) => p.key === phraseKey,
    );

    if (phrase) {
      this.selectPhrase(phrase);
    }

    this.requestUpdate();
    this.modalEl?.open();
  }
}
