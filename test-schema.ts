import { GameConfigSchema } from "./src/core/Schemas.js";
import { GameMapType, GameMapSize, GameType, GameMode, Difficulty } from "./src/core/game/Game.js";

const config = {
    gameMap: GameMapType.World,
    gameMapSize: GameMapSize.Normal,
    gameType: GameType.Singleplayer,
    gameMode: GameMode.FFA,
    playerTeams: 0,
    difficulty: Difficulty.Medium,
    maxTimerValue: undefined,
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

const result = GameConfigSchema.safeParse(config);
if (!result.success) {
    console.log("Validation failed:");
    console.dir(result.error.format(), { depth: null });
} else {
    console.log("Validation straight up succeeded!");
}
