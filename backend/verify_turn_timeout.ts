/// <reference types="node" />
import { io, Socket } from "socket.io-client";

/**
 * Verifies open-box turn timeout behaviour:
 * - Start a 2-player game
 * - Intentionally do NOT act on the first turn
 * - Assert the server skips to the next player after `turnExpiresAt`
 * - Finish the game and assert the timed-out player received the correct -50 timeout penalty in points
 */

const URL = "http://localhost:3001";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GameStateUpdate = {
  phase: "waiting" | "selection" | "playing" | "offer" | "finished";
  players: Array<{ id: string; role: "player" | "spectator"; isReady: boolean; boxNumber: number | null }>;
  boxes: Array<{ number: number; isOpened: boolean; value: number | null; ownerId: string | null }>;
  currentRound: number;
  boxesOpenedThisRound: number[];
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
  console.log(`[verify_turn_timeout] connected: ${name} (${socket.id})`);
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
  console.log("[verify_turn_timeout] starting…");

  const hostSocket = await connect("TimeoutHost");
  const joinSocket = await connect("TimeoutJoin");

  try {
    // Lightweight debug to confirm we are receiving state updates at all (cap output).
    let debugCount = 0;
    const debugListener = (s: GameStateUpdate) => {
      if (debugCount >= 12) return;
      debugCount += 1;
      console.log(
        `[verify_turn_timeout][debug] phase=${s.phase} round=${s.currentRound} players=${s.players?.length ?? 0} turn=${s.currentTurnPlayerId ?? "null"}`
      );
    };
    hostSocket.on("game-state-update", debugListener);

    const createRes = await emitAck<{ playerName: string }, { success: boolean; roomCode: string; playerId: string }>(
      hostSocket,
      "create-room",
      { playerName: "TimeoutHost" }
    );
    const roomCode = createRes.roomCode;
    const hostId = createRes.playerId;

    const joinRes = await emitAck<{ roomCode: string; playerName: string }, { success: boolean; playerId: string }>(
      joinSocket,
      "join-room",
      { roomCode, playerName: "TimeoutJoin" }
    );
    const joinId = joinRes.playerId;

    // Select + ready
    const hostBox = 1;
    const joinBox = 20;
    hostSocket.emit("select-box", { boxNumber: hostBox });
    joinSocket.emit("select-box", { boxNumber: joinBox });
    await wait(150);
    const lobbyReadyPromise = waitForState(
      hostSocket,
      (s) => {
        if (s.phase !== "waiting") return false;
        const players = s.players.filter((p) => p.role === "player");
        return players.length === 2 && players.every((p) => p.isReady && p.boxNumber !== null);
      },
      5000
    );
    hostSocket.emit("player-ready");
    joinSocket.emit("player-ready");
    await lobbyReadyPromise;

    // IMPORTANT: attach the listener BEFORE starting the game, otherwise we can miss the first update.
    const firstTurnPromise = waitForState(
      hostSocket,
      (s) => s.phase === "playing" && !!s.currentTurnPlayerId && !!s.turnExpiresAt && s.currentRound === 1,
      10000
    );

    // Start game
    hostSocket.emit("start-game");

    // Wait for the first playing turn and intentionally do NOT act
    const firstTurn = await firstTurnPromise;

    if (!firstTurn.currentTurnPlayerId || !firstTurn.turnExpiresAt) throw new Error("Missing turn info");
    if (firstTurn.boxesOpenedThisRound.length !== 0) throw new Error("Expected 0 opened boxes at start of round");

    const timedOutPlayerId = firstTurn.currentTurnPlayerId;
    const expectedNextPlayerId = timedOutPlayerId === hostId ? joinId : hostId;

    const msToExpiry = Math.max(0, firstTurn.turnExpiresAt - Date.now());

    // Auto-play listener will be attached BEFORE the timeout fires, but disabled until we confirm the skip happened.
    const reserved = new Set<number>([hostBox, joinBox]);
    let autoPlayEnabled = false;
    let lastTurnHandled: number | null = null;
    let offerResponded = false;

    hostSocket.on("game-state-update", async (state: GameStateUpdate) => {
      if (!autoPlayEnabled) return;

      if (state.phase === "playing" && state.currentTurnPlayerId && state.turnExpiresAt) {
        if (lastTurnHandled === state.turnExpiresAt) return;
        const mySocket = state.currentTurnPlayerId === hostId ? hostSocket : joinSocket;
        const boxToOpen = pickOpenableBox(state, reserved);
        if (!boxToOpen) return;
        lastTurnHandled = state.turnExpiresAt;
        await wait(50);
        mySocket.emit("open-box", { boxNumber: boxToOpen });
      }

      if (state.phase === "offer" && state.currentOffer !== null && !offerResponded) {
        offerResponded = true;
        hostSocket.emit("deal-response", { accepted: true });
        joinSocket.emit("deal-response", { accepted: false });
      }
    });

    // Server should have advanced the turn to the other player (skip).
    // IMPORTANT: attach the listener BEFORE the timeout happens, otherwise we can miss the update.
    const afterTimeout = await waitForState(
      hostSocket,
      (s) =>
        s.phase === "playing" &&
        s.currentTurnPlayerId === expectedNextPlayerId &&
        typeof s.turnExpiresAt === "number" &&
        s.turnExpiresAt !== firstTurn.turnExpiresAt,
      msToExpiry + 10000
    );

    if (afterTimeout.boxesOpenedThisRound.length !== 0) {
      throw new Error("Turn timeout should not auto-open any box");
    }

    // Enable auto-play now that we've observed the skip, and immediately take an action
    // for the current turn so we don't accidentally incur a second timeout.
    autoPlayEnabled = true;
    if (afterTimeout.phase === "playing" && afterTimeout.currentTurnPlayerId && afterTimeout.turnExpiresAt) {
      const mySocket = afterTimeout.currentTurnPlayerId === hostId ? hostSocket : joinSocket;
      const boxToOpen = pickOpenableBox(afterTimeout, reserved);
      if (boxToOpen) {
        lastTurnHandled = afterTimeout.turnExpiresAt;
        mySocket.emit("open-box", { boxNumber: boxToOpen });
      }
    }

    const gameEndedPromise = new Promise<GameEndedPayload>((resolve) => {
      hostSocket.on("game-ended", (payload: GameEndedPayload) => resolve(payload));
    });

    const finishedStatePromise = waitForState(hostSocket, (s) => s.phase === "finished", 60000);

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
      timeoutCount: timedOutPlayerId === hostId ? 1 : 0,
    });

    const expectedJoinPoints = calculateExpectedPoints({
      finalWinnings: joinEntry.amount,
      finalBoxValue: joinBoxValue,
      roundDealt,
      isLastStanding: joinEntry.wasBoxValue,
      isHighestWinnings: joinEntry.amount === highest,
      timeoutCount: timedOutPlayerId === joinId ? 1 : 0,
    });

    if (hostEntry.points !== expectedHostPoints) {
      throw new Error(`Host points mismatch expected=${expectedHostPoints} actual=${hostEntry.points}`);
    }
    if (joinEntry.points !== expectedJoinPoints) {
      throw new Error(`Join points mismatch expected=${expectedJoinPoints} actual=${joinEntry.points}`);
    }

    console.log("[verify_turn_timeout] ✅ OK");
  } finally {
    hostSocket.off("game-state-update");
    hostSocket.disconnect();
    joinSocket.disconnect();
  }
}

run().catch((err) => {
  console.error("[verify_turn_timeout] ❌ FAILED:", err?.message || err);
  process.exitCode = 1;
});


