import { GameStartInfoSchema } from "./src/core/Schemas.js";
import { GameMapType, GameMapSize, GameType, GameMode, Difficulty } from "./src/core/game/Game.js";
import { generateID } from "./src/core/Util.js";

const config = {
    gameMap: GameMapType.World,
    gameMapSize: GameMapSize.Normal,
    gameType: GameType.Singleplayer,
    gameMode: GameMode.FFA,
    difficulty: Difficulty.Medium,
    bots: 400,
    infiniteGold: false,
    donateGold: false,
    donateTroops: false,
    infiniteTroops: false,
    instantBuild: false,
    randomSpawn: false,
    disabledUnits: [],
    disableNations: false,
    disableBoats: false,
    weightedAttacks: false,
};

const payload = {
    gameID: generateID(),
    lobbyCreatedAt: Date.now(),
    config: config,
    players: [
        {
            clientID: generateID(),
            username: "Player123",
            cosmetics: undefined,
            isLobbyCreator: true,
            isBot: false,
        },
        {
            clientID: generateID(),
            username: "Bot 1",
            cosmetics: undefined,
            isLobbyCreator: false,
            isBot: true,
        }
    ],
};

const result = GameStartInfoSchema.safeParse(payload);
if (!result.success) {
    console.log("Validation failed:");
    console.dir(result.error.format(), { depth: null });
} else {
    console.log("Validation straight up succeeded!");
}
