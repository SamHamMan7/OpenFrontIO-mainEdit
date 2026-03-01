import { Execution, Game, Unit } from "../game/Game";
import { GameImpl } from "../game/GameImpl";

export class ExtractionSiteExecution implements Execution {
    private active = true;

    // Amount extracted per tick
    private readonly OIL_PER_TICK = 5n;
    private readonly GOLD_PER_TICK = 50_000n;
    // How often to extract (every X ticks) - approx 5 seconds depending on turn interval
    private readonly TICK_INTERVAL = 30;

    constructor(private unit: Unit) { }

    init(mg: Game, ticks: number): void {
        if (!this.unit.isActive()) {
            this.active = false;
        }
    }

    tick(ticks: number): void {
        if (!this.unit.isActive()) {
            this.active = false;
            return;
        }

        if (this.unit.isUnderConstruction()) {
            return;
        }

        if (ticks % this.TICK_INTERVAL === 0) {
            this.extract(this.unit.mg);
        }
    }

    private extract(mg: Game) {
        if (!(mg instanceof GameImpl)) return;

        const tile = this.unit.tile();
        const deposit = mg._undergroundDeposits.get(tile);

        if (!deposit) {
            // If there is no deposit, maybe it was a fallback tile or they built it blindly
            // Provide a very tiny trickle if desired, or nothing. For now, provide nothing.
            return;
        }

        const owner = this.unit.owner();
        if (!owner || !owner.isPlayer()) return;

        const multiplier = BigInt(mg.config().goldMultiplier());

        if (deposit.type === 'Oil') {
            owner.addOil(this.OIL_PER_TICK * multiplier);
        } else if (deposit.type === 'Gold') {
            owner.addGold(this.GOLD_PER_TICK * multiplier);
        }

        // If amount is not infinite, deduct from it here. But currently it's "infinite". 
    }

    isActive(): boolean {
        return this.active;
    }

    activeDuringSpawnPhase(): boolean {
        return false;
    }
}
