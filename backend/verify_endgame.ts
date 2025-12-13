/// <reference types="node" />
import { io, Socket } from "socket.io-client";

/**
 * End-to-end verification:
 * - Create room + join (2 players)
 * - Select unique personal boxes
 * - Start game
 * - Open required boxes for Round 1 to trigger a banker offer
 * - One player accepts Deal, other rejects (forcing last-player reveal)
 * - Assert final leaderboard points match the client-approved formula
 */

const URL = "http://localhost:3001";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GameStateUpdate = {
  phase: "waiting" | "selection" | "playing" | "offer" | "finished";
  players: Array<{
    id: string;
    name: string;
    role: "player" | "spectator";
    boxNumber: number | null;
    hasDealt: boolean;
    dealAmount: number | null;
  }>;
  boxes: Array<{
    number: number;
    isOpened: boolean;
    value: number | null;
    ownerId: string | null;
  }>;
  currentRound: number;
  boxesToOpenThisRound: number;
  boxesOpenedThisRound: number[];
  remainingValues: number[];
  eliminatedValues: number[];
  currentOffer: number | null;
  offerExpiresAt: number | null;
  currentTurnPlayerId: string | null;
  turnExpiresAt: number | null;
};

type GameEndedPayload = {
  leaderboard: Array<{
    playerId: string;
    playerName: string;
    amount: number;
    points: number;
    wasBoxValue: boolean;
    rank: number;
  }>;
};

function calculateExpectedPoints(params: {
  finalWinnings: number;
  finalBoxValue: number;
  roundDealt: number;
  isLastStanding: boolean;
  isHighestWinnings: boolean;
  timeoutCount: number;
}): number {
  const {
    finalWinnings,
    finalBoxValue,
    roundDealt,
    isLastStanding,
    isHighestWinnings,
    timeoutCount,
  } = params;

  let points = 0;
  points += Math.min(Math.floor(finalWinnings / 100), 3000);
  if (finalWinnings > finalBoxValue) points += 200;
  if (roundDealt >= 4) points += 150;
  if (roundDealt <= 2) points -= 50;
  if (isLastStanding) points += 200;
  if (isHighestWinnings) points += 200;
  points -= timeoutCount * 50;
  return Math.max(points, 0);
}

async function connect(name: string): Promise<Socket> {
  const socket = io(URL, { transports: ["websocket", "polling"] });
  await new Promise<void>((resolve) => socket.on("connect", () => resolve()));
  console.log(`[verify_endgame] connected: ${name} (${socket.id})`);
  return socket;
}

async function emitAck<TReq, TRes>(
  socket: Socket,
  event: string,
  payload: TReq
): Promise<TRes> {
  return await new Promise<TRes>((resolve, reject) => {
    socket.emit(event, payload, (res: any) => {
      // Backends in this repo use { success: boolean, ... } responses
      if (res && typeof res.success === "boolean" && res.success === false) {
        reject(new Error(res.error || `Failed: ${event}`));
        return;
      }
      resolve(res as TRes);
    });
  });
}

function pickOpenableBox(state: GameStateUpdate, reservedBoxNumbers: Set<number>): number | null {
  const candidate = state.boxes
    .filter((b) => !b.isOpened)
    .filter((b) => b.ownerId === null)
    .map((b) => b.number)
    .filter((n) => !reservedBoxNumbers.has(n))
    .sort((a, b) => a - b)[0];
  return typeof candidate === "number" ? candidate : null;
}

async function run() {
  console.log("[verify_endgame] starting…");

  const hostName = "VerifyHost";
  const joinName = "VerifyJoin";

  const hostSocket = await connect(hostName);
  const joinSocket = await connect(joinName);

  let roomCode = "";
  let hostId = "";
  let joinId = "";

  // Keep last seen state for later assertions (from host perspective is enough)
  let lastState: GameStateUpdate | null = null;

  try {
    const createRes = await emitAck<{ playerName: string }, { success: boolean; roomCode: string; playerId: string }>(
      hostSocket,
      "create-room",
      { playerName: hostName }
    );
    roomCode = createRes.roomCode;
    hostId = createRes.playerId;

    const joinRes = await emitAck<
      { roomCode: string; playerName: string },
      { success: boolean; playerId: string }
    >(joinSocket, "join-room", { roomCode, playerName: joinName });
    joinId = joinRes.playerId;

    // Select distinct personal boxes
    const hostBox = 1;
    const joinBox = 20;
    hostSocket.emit("select-box", { boxNumber: hostBox });
    joinSocket.emit("select-box", { boxNumber: joinBox });
    await wait(150);

    hostSocket.emit("player-ready");
    joinSocket.emit("player-ready");
    await wait(150);

    // Listen for authoritative state updates (host receives its own personalised updates)
    const reserved = new Set<number>([hostBox, joinBox]);
    let lastTurnHandled: number | null = null; // use turnExpiresAt as per-turn unique id
    let offerResponded = false;

    const gameEndedPromise = new Promise<GameEndedPayload>((resolve) => {
      hostSocket.on("game-ended", (payload: GameEndedPayload) => resolve(payload));
    });

    const finishedStatePromise = new Promise<GameStateUpdate>((resolve) => {
      hostSocket.on("game-state-update", (state: GameStateUpdate) => {
        lastState = state;
        if (state.phase === "finished") resolve(state);
      });
    });

    hostSocket.on("game-state-update", async (state: GameStateUpdate) => {
      lastState = state;

      if (state.phase === "playing" && state.currentTurnPlayerId && state.turnExpiresAt) {
        if (lastTurnHandled === state.turnExpiresAt) return; // already acted for this turn

        const currentTurnPlayerId = state.currentTurnPlayerId;
        const mySocket = currentTurnPlayerId === hostId ? hostSocket : joinSocket;

        const boxToOpen = pickOpenableBox(state, reserved);
        if (!boxToOpen) return;

        lastTurnHandled = state.turnExpiresAt;
        await wait(50);
        mySocket.emit("open-box", { boxNumber: boxToOpen });
        return;
      }

      if (state.phase === "offer" && state.currentOffer !== null && !offerResponded) {
        offerResponded = true;

        // Force a deterministic endgame:
        // - host takes the Deal
        // - joiner rejects -> becomes last standing -> auto reveal -> game ends
        hostSocket.emit("deal-response", { accepted: true });
        joinSocket.emit("deal-response", { accepted: false });
      }
    });

    // Start game (host only)
    hostSocket.emit("start-game");

    const ended = await gameEndedPromise;
    const finishedState = await finishedStatePromise;

    if (!lastState) throw new Error("Did not receive any game state");
    if (ended.leaderboard.length !== 2) throw new Error(`Expected 2 leaderboard entries, got ${ended.leaderboard.length}`);

    const byId = new Map(ended.leaderboard.map((e) => [e.playerId, e]));
    const hostEntry = byId.get(hostId);
    const joinEntry = byId.get(joinId);
    if (!hostEntry || !joinEntry) throw new Error("Missing leaderboard entries for expected players");

    // Reconstruct box values from finished state (opened boxes reveal their value)
    const boxValueByNumber = new Map<number, number>();
    finishedState.boxes.forEach((b) => {
      if (b.isOpened && typeof b.value === "number") {
        boxValueByNumber.set(b.number, b.value);
      }
    });

    const hostBoxValue = boxValueByNumber.get(1);
    const joinBoxValue = boxValueByNumber.get(20);
    if (typeof hostBoxValue !== "number" || typeof joinBoxValue !== "number") {
      throw new Error("Could not read final personal box values from finished state");
    }

    // In this test, game ends right after the first offer (Round 1)
    const roundDealt = 1;
    const timeoutCount = 0;

    const highest = Math.max(hostEntry.amount, joinEntry.amount);

    const expectedHostPoints = calculateExpectedPoints({
      finalWinnings: hostEntry.amount,
      finalBoxValue: hostBoxValue,
      roundDealt,
      isLastStanding: hostEntry.wasBoxValue,
      isHighestWinnings: hostEntry.amount === highest,
      timeoutCount,
    });

    const expectedJoinPoints = calculateExpectedPoints({
      finalWinnings: joinEntry.amount,
      finalBoxValue: joinBoxValue,
      roundDealt,
      isLastStanding: joinEntry.wasBoxValue,
      isHighestWinnings: joinEntry.amount === highest,
      timeoutCount,
    });

    if (hostEntry.points !== expectedHostPoints) {
      throw new Error(
        `Host points mismatch. expected=${expectedHostPoints} actual=${hostEntry.points} (winnings=${hostEntry.amount} box=${hostBoxValue})`
      );
    }

    if (joinEntry.points !== expectedJoinPoints) {
      throw new Error(
        `Join points mismatch. expected=${expectedJoinPoints} actual=${joinEntry.points} (winnings=${joinEntry.amount} box=${joinBoxValue})`
      );
    }

    console.log("[verify_endgame] ✅ OK");
    console.log(
      `[verify_endgame] host: winnings=£${hostEntry.amount.toLocaleString("en-GB")} box=£${hostBoxValue.toLocaleString(
        "en-GB"
      )} points=${hostEntry.points}`
    );
    console.log(
      `[verify_endgame] join: winnings=£${joinEntry.amount.toLocaleString("en-GB")} box=£${joinBoxValue.toLocaleString(
        "en-GB"
      )} points=${joinEntry.points} (wasBoxValue=${joinEntry.wasBoxValue})`
    );
  } finally {
    hostSocket.disconnect();
    joinSocket.disconnect();
  }
}

run().catch((err) => {
  console.error("[verify_endgame] ❌ FAILED:", err?.message || err);
  process.exitCode = 1;
});





