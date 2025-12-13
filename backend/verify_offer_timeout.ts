/// <reference types="node" />
import { io, Socket } from "socket.io-client";

/**
 * Verifies banker-offer timeout behaviour:
 * - Start a 2-player game
 * - Play Round 1 until offer
 * - One player takes the Deal
 * - The other player does NOT respond; wait past `offerExpiresAt`
 * - Assert game ends and the non-responder received the correct -50 timeout penalty in points
 */

const URL = "http://localhost:3001";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GameStateUpdate = {
  phase: "waiting" | "selection" | "playing" | "offer" | "finished";
  boxes: Array<{ number: number; isOpened: boolean; value: number | null; ownerId: string | null }>;
  currentRound: number;
  currentOffer: number | null;
  offerExpiresAt: number | null;
  currentTurnPlayerId: string | null;
  turnExpiresAt: number | null;
};

type GameEndedPayload = {
  leaderboard: Array<{
    playerId: string;
    amount: number;
    points: number;
    wasBoxValue: boolean;
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
  let points = 0;

  points += Math.min(Math.floor(params.finalWinnings / 100), 3000);
  if (params.finalWinnings > params.finalBoxValue) points += 200;
  if (params.roundDealt >= 4) points += 150;
  if (params.roundDealt <= 2) points -= 50;
  if (params.isLastStanding) points += 200;
  if (params.isHighestWinnings) points += 200;
  points -= params.timeoutCount * 50;

  return Math.max(points, 0);
}

async function connect(name: string): Promise<Socket> {
  const socket = io(URL, { transports: ["websocket", "polling"] });
  await new Promise<void>((resolve) => socket.on("connect", () => resolve()));
  console.log(`[verify_offer_timeout] connected: ${name} (${socket.id})`);
  return socket;
}

async function emitAck<TReq, TRes>(socket: Socket, event: string, payload: TReq): Promise<TRes> {
  return await new Promise<TRes>((resolve, reject) => {
    socket.emit(event, payload, (res: any) => {
      if (res && typeof res.success === "boolean" && res.success === false) {
        reject(new Error(res.error || `Failed: ${event}`));
        return;
      }
      resolve(res as TRes);
    });
  });
}

function pickOpenableBox(state: GameStateUpdate, reserved: Set<number>): number | null {
  const candidate = state.boxes
    .filter((b) => !b.isOpened && b.ownerId === null)
    .map((b) => b.number)
    .filter((n) => !reserved.has(n))
    .sort((a, b) => a - b)[0];

  return typeof candidate === "number" ? candidate : null;
}

async function waitForState(host: Socket, predicate: (s: GameStateUpdate) => boolean, timeoutMs: number): Promise<GameStateUpdate> {
  return await new Promise<GameStateUpdate>((resolve, reject) => {
    const timer = setTimeout(() => {
      host.off("game-state-update", onUpdate);
      reject(new Error("Timed out waiting for expected state"));
    }, timeoutMs);

    const onUpdate = (state: GameStateUpdate) => {
      if (!predicate(state)) return;
      clearTimeout(timer);
      host.off("game-state-update", onUpdate);
      resolve(state);
    };

    host.on("game-state-update", onUpdate);
  });
}

async function run() {
  console.log("[verify_offer_timeout] starting…");

  const hostSocket = await connect("OfferHost");
  const joinSocket = await connect("OfferJoin");

  try {
    const createRes = await emitAck<{ playerName: string }, { success: boolean; roomCode: string; playerId: string }>(
      hostSocket,
      "create-room",
      { playerName: "OfferHost" }
    );
    const roomCode = createRes.roomCode;
    const hostId = createRes.playerId;

    const joinRes = await emitAck<{ roomCode: string; playerName: string }, { success: boolean; playerId: string }>(
      joinSocket,
      "join-room",
      { roomCode, playerName: "OfferJoin" }
    );
    const joinId = joinRes.playerId;

    // Select + ready
    const hostBox = 1;
    const joinBox = 20;
    hostSocket.emit("select-box", { boxNumber: hostBox });
    joinSocket.emit("select-box", { boxNumber: joinBox });
    await wait(150);
    hostSocket.emit("player-ready");
    joinSocket.emit("player-ready");
    await wait(150);

    const reserved = new Set<number>([hostBox, joinBox]);
    let lastTurnHandled: number | null = null;

    // Attach listeners BEFORE starting the game to avoid missing the initial turn update.
    const gameEndedPromise = new Promise<GameEndedPayload>((resolve) => {
      hostSocket.once("game-ended", (payload: GameEndedPayload) => resolve(payload));
    });
    const finishedStatePromise = waitForState(hostSocket, (s) => s.phase === "finished", 60000);
    const offerStatePromise = waitForState(
      hostSocket,
      (s) => s.phase === "offer" && s.currentOffer !== null && typeof s.offerExpiresAt === "number" && s.currentRound === 1,
      60000
    );

    // Auto-play turns until offer appears
    hostSocket.on("game-state-update", async (state: GameStateUpdate) => {
      if (state.phase !== "playing") return;
      if (!state.currentTurnPlayerId || !state.turnExpiresAt) return;
      if (lastTurnHandled === state.turnExpiresAt) return;

      const mySocket = state.currentTurnPlayerId === hostId ? hostSocket : joinSocket;
      const boxToOpen = pickOpenableBox(state, reserved);
      if (!boxToOpen) return;

      lastTurnHandled = state.turnExpiresAt;
      await wait(50);
      mySocket.emit("open-box", { boxNumber: boxToOpen });
    });

    // Start game
    hostSocket.emit("start-game");

    const offerState = await offerStatePromise;

    if (!offerState.offerExpiresAt) throw new Error("Missing offerExpiresAt");

    // Accept deal for joiner; host does NOT respond (timeout => auto No Deal)
    joinSocket.emit("deal-response", { accepted: true });

    // Wait past expiry for server to auto-apply "No Deal" + timeout penalty
    const msToOfferExpiry = Math.max(0, offerState.offerExpiresAt - Date.now());
    await wait(msToOfferExpiry + 1000);

    const ended = await gameEndedPromise;
    const finishedState = await finishedStatePromise;

    const leaderboardById = new Map(ended.leaderboard.map((e) => [e.playerId, e]));
    const hostEntry = leaderboardById.get(hostId);
    const joinEntry = leaderboardById.get(joinId);
    if (!hostEntry || !joinEntry) throw new Error("Missing leaderboard entries");

    const boxValueByNumber = new Map<number, number>();
    finishedState.boxes.forEach((b) => {
      if (b.isOpened && typeof b.value === "number") boxValueByNumber.set(b.number, b.value);
    });
    const hostBoxValue = boxValueByNumber.get(hostBox);
    const joinBoxValue = boxValueByNumber.get(joinBox);
    if (typeof hostBoxValue !== "number" || typeof joinBoxValue !== "number") {
      throw new Error("Could not read personal box values from finished state");
    }

    const roundDealt = 1;
    const highest = Math.max(hostEntry.amount, joinEntry.amount);

    const expectedHostPoints = calculateExpectedPoints({
      finalWinnings: hostEntry.amount,
      finalBoxValue: hostBoxValue,
      roundDealt,
      isLastStanding: hostEntry.wasBoxValue,
      isHighestWinnings: hostEntry.amount === highest,
      timeoutCount: 1, // offer timeout
    });

    const expectedJoinPoints = calculateExpectedPoints({
      finalWinnings: joinEntry.amount,
      finalBoxValue: joinBoxValue,
      roundDealt,
      isLastStanding: joinEntry.wasBoxValue,
      isHighestWinnings: joinEntry.amount === highest,
      timeoutCount: 0,
    });

    if (hostEntry.points !== expectedHostPoints) {
      throw new Error(`Host points mismatch expected=${expectedHostPoints} actual=${hostEntry.points}`);
    }
    if (joinEntry.points !== expectedJoinPoints) {
      throw new Error(`Join points mismatch expected=${expectedJoinPoints} actual=${joinEntry.points}`);
    }

    console.log("[verify_offer_timeout] ✅ OK");
  } finally {
    hostSocket.disconnect();
    joinSocket.disconnect();
  }
}

run().catch((err) => {
  console.error("[verify_offer_timeout] ❌ FAILED:", err?.message || err);
  process.exitCode = 1;
});


