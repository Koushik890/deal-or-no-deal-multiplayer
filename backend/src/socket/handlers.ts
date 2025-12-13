/**
 * Socket.io event handlers
 * 
 * Handles all real-time game events with:
 * - Turn order rotation system
 * - Per-action timers (20s)
 * - Disconnect/reconnect handling
 * - Spectator support
 */

import { Server, Socket } from 'socket.io';
import {
    createRoom,
    joinRoom,
    getRoom,
    getRoomByPlayerId,
    getPlayerIdFromSocket,
    getPlayer,
    updatePlayer,
    removePlayer,
    updateGameState,
    getRoomSocketIds,
    addChatMessage,
    reconnectPlayer,
    updateGlobalLeaderboard,
    handleDisconnect,
    setRoomPassword,
    getGlobalLeaderboard,
} from '../store/rooms';
import {
    GameStateUpdate,
    PlayerPublicInfo,
    BoxPublicInfo,
    CreateRoomPayload,
    JoinRoomPayload,
    SelectBoxPayload,
    OpenBoxesPayload,
    DealResponsePayload,
    ChatMessagePayload,
    Player,
    GameState,
} from '../store/types';
import { calculateBankerOffer } from '../game/banker';
import { getBoxesToOpenForRound, OFFER_TIMEOUT_MS, MIN_PLAYERS_TO_START, BOX_OPEN_TIMEOUT_MS } from '../game/constants';
import { calculatePoints } from '../game/points';

// Store turn timers by room code
const turnTimers: Map<string, NodeJS.Timeout> = new Map();
// Store offer timers by room code
const offerTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Check if any non-personal, unopened boxes remain (i.e., a player can take an action)
 */
function hasOpenableBoxes(gameState: GameState): boolean {
    const isReservedPlayerBox = (boxNumber: number) =>
        Array.from(gameState.players.values()).some((p) => p.role === 'player' && p.boxNumber === boxNumber);

    return gameState.boxes.some((b) => !b.isOpened && !isReservedPlayerBox(b.number));
}

/**
 * Convert game state to public update (hides secret values)
 */
function createGameStateUpdate(
    gameState: GameState,
    forPlayerId: string,
    recentlyOpenedBox?: { boxNumber: number; value: number }
): GameStateUpdate {
    const players: PlayerPublicInfo[] = Array.from(gameState.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isReady: p.isReady,
        role: p.role,
        boxNumber: p.boxNumber,
        hasDealt: p.hasDealt,
        dealAmount: p.dealAmount,
        isActive: !p.hasDealt && p.boxNumber !== null && p.role === 'player',
        isConnected: p.isConnected,
    }));

    const currentPlayer = gameState.players.get(forPlayerId);

    const boxes: BoxPublicInfo[] = gameState.boxes.map((box) => ({
        number: box.number,
        isOpened: box.isOpened,
        value: box.isOpened ? box.value : null, // Only show value if opened
        isPlayerBox: currentPlayer?.boxNumber === box.number,
        ownerId: Array.from(gameState.players.values()).find((p) => p.boxNumber === box.number)?.id || null,
    }));

    return {
        phase: gameState.phase,
        players,
        boxes,
        currentRound: gameState.currentRound,
        boxesToOpenThisRound: getBoxesToOpenForRound(gameState.currentRound),
        boxesOpenedThisRound: gameState.boxesOpenedThisRound,
        remainingValues: gameState.remainingValues,
        eliminatedValues: gameState.eliminatedValues,
        currentOffer: gameState.currentOffer,
        offerExpiresAt: gameState.offerExpiresAt,
        currentTurnPlayerId: gameState.currentTurnPlayerId,
        turnExpiresAt: gameState.turnExpiresAt,
        recentlyOpenedBox,
    };
}

/**
 * Broadcast game state to all players in room
 */
function broadcastGameState(
    io: Server,
    roomCode: string,
    recentlyOpenedBox?: { boxNumber: number; value: number }
): void {
    const room = getRoom(roomCode);
    if (!room) return;

    // Send personalised state to each connected player
    room.gameState.players.forEach((player) => {
        if (player.isConnected) {
            const update = createGameStateUpdate(room.gameState, player.id, recentlyOpenedBox);
            io.to(player.socketId).emit('game-state-update', update);
        }
    });
}

/**
 * Check if all active players have dealt
 */
function checkGameEnd(gameState: GameState): boolean {
    const activePlayers = Array.from(gameState.players.values()).filter(
        (p) => p.role === 'player' && p.boxNumber !== null && !p.hasDealt
    );
    return activePlayers.length === 0;
}

/**
 * Check if only one active player remains
 */
function getLastActivePlayer(gameState: GameState): Player | null {
    const activePlayers = Array.from(gameState.players.values()).filter(
        (p) => p.role === 'player' && p.boxNumber !== null && !p.hasDealt
    );
    return activePlayers.length === 1 ? activePlayers[0] : null;
}

/**
 * Check if all players are ready
 */
function allPlayersReady(gameState: GameState): boolean {
    const players = Array.from(gameState.players.values())
        .filter(p => p.role === 'player');
    return (
        players.length >= MIN_PLAYERS_TO_START &&
        players.every((p) => p.isReady && p.boxNumber !== null)
    );
}

/**
 * Get next active player in turn order
 */
function getNextActivePlayerIndex(gameState: GameState, startIndex: number): number {
    const { turnOrder, players } = gameState;
    if (turnOrder.length === 0) return -1;

    for (let i = 0; i < turnOrder.length; i++) {
        const idx = (startIndex + i) % turnOrder.length;
        const playerId = turnOrder[idx];
        const player = players.get(playerId);
        if (player && !player.hasDealt && player.role === 'player') {
            return idx;
        }
    }
    return -1;
}

/**
 * Clear any existing turn timer for a room
 */
function clearTurnTimer(roomCode: string): void {
    const existing = turnTimers.get(roomCode);
    if (existing) {
        clearTimeout(existing);
        turnTimers.delete(roomCode);
    }
}

/**
 * Clear any existing offer timer for a room
 */
function clearOfferTimer(roomCode: string): void {
    const existing = offerTimers.get(roomCode);
    if (existing) {
        clearTimeout(existing);
        offerTimers.delete(roomCode);
    }
}

/**
 * Set the current turn player and start timer
 */
function setCurrentTurn(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room || room.gameState.phase !== 'playing') return;

    // If there are no openable boxes left, go straight to an offer (prevents deadlocks in late game / many players)
    if (!hasOpenableBoxes(room.gameState)) {
        triggerBankerOffer(io, roomCode);
        return;
    }

    clearTurnTimer(roomCode);

    const nextIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex);
    if (nextIdx === -1) {
        // No active players left
        return;
    }

    const playerId = room.gameState.turnOrder[nextIdx];
    const expiresAt = Date.now() + BOX_OPEN_TIMEOUT_MS;

    updateGameState(roomCode, {
        currentTurnIndex: nextIdx,
        currentTurnPlayerId: playerId,
        turnExpiresAt: expiresAt,
    });

    broadcastGameState(io, roomCode);

    // Set timeout for turn expiry
    const timer = setTimeout(() => {
        handleTurnTimeout(io, roomCode, playerId);
    }, BOX_OPEN_TIMEOUT_MS);

    turnTimers.set(roomCode, timer);
}

/**
 * Handle turn timeout - skip player's turn
 */
function handleTurnTimeout(io: Server, roomCode: string, playerId: string): void {
    const room = getRoom(roomCode);
    if (!room || room.gameState.phase !== 'playing') return;
    if (room.gameState.currentTurnPlayerId !== playerId) return;

    const player = room.gameState.players.get(playerId);
    if (player) {
        player.timeoutCount += 1;
        console.log(`[Game] Player ${playerId} timed out (count: ${player.timeoutCount})`);
    }

    // Move to next player
    const nextIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex + 1);
    if (nextIdx === -1) {
        // No more active players, check if round complete
        const boxesToOpen = getBoxesToOpenForRound(room.gameState.currentRound);
        if (room.gameState.boxesOpenedThisRound.length >= boxesToOpen) {
            triggerBankerOffer(io, roomCode);
        }
        return;
    }

    updateGameState(roomCode, { currentTurnIndex: nextIdx });
    setCurrentTurn(io, roomCode);
}

/**
 * Emit a lightweight "This Game" leaderboard update while the game is in progress.
 * This is intentionally provisional: only players who have finished (dealt/last standing)
 * will have points > 0.
 */
function emitLeaderboardUpdate(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    const entries = Array.from(room.gameState.players.values())
        .filter((p) => p.role === 'player' && p.boxNumber !== null)
        .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            amount: p.dealAmount || 0,
            points: p.points || 0,
            // In-progress leaderboard is provisional; last-standing (box reveal) only happens at the end.
            wasBoxValue: !!p.isLastStanding,
            rank: 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    io.to(roomCode).emit('leaderboard-update', { leaderboard: entries });
}

/**
 * Send a single leaderboard snapshot to a specific socket.
 * This prevents clients from missing the final leaderboard if they disconnect/reconnect
 * around the end of a game (Socket.io events are not replayed).
 */
function emitLeaderboardSnapshotToSocket(io: Server, roomCode: string, socketId: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    const leaderboard = Array.from(room.gameState.players.values())
        .filter((p) => p.role === 'player' && p.boxNumber !== null)
        .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            amount: p.dealAmount || 0,
            points: p.points || 0,
            wasBoxValue: !!p.isLastStanding,
            rank: 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    if (room.gameState.phase === 'finished') {
        io.to(socketId).emit('game-ended', { leaderboard });
    } else {
        io.to(socketId).emit('leaderboard-update', { leaderboard });
    }
}

/**
 * Finalise the game: calculate final points & leaderboard and broadcast to all.
 */
function finishGame(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    clearTurnTimer(roomCode);
    clearOfferTimer(roomCode);

    // Build final results for all real players
    const players = Array.from(room.gameState.players.values())
        .filter((p) => p.role === 'player' && p.boxNumber !== null);

    // Determine highest final winnings for bonus
    const finalAmounts = players.map((p) => p.dealAmount || 0);
    const highestWinnings = finalAmounts.length > 0 ? Math.max(...finalAmounts) : 0;

    // Calculate final points per player
    players.forEach((p) => {
        const finalWinnings = p.dealAmount || 0;
        const finalBoxValue = p.boxValue || 0;
        const roundDealt = p.roundDealt || room.gameState.currentRound;

        const points = calculatePoints({
            finalWinnings,
            finalBoxValue,
            roundDealt,
            isLastStanding: p.isLastStanding,
            isHighestWinnings: finalWinnings === highestWinnings,
            timeoutCount: p.timeoutCount,
        });

        p.points = points;
    });

    // Update global leaderboard (runtime)
    players.forEach((p) => {
        updateGlobalLeaderboard(p.id, p.name, p.points);
    });

    const leaderboard = players
        .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            amount: p.dealAmount || 0,
            points: p.points,
            // True only for the final remaining active player, whose winnings come from their box reveal.
            wasBoxValue: !!p.isLastStanding,
            rank: 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Broadcast game ended + final leaderboard to everyone (players + spectators)
    io.to(roomCode).emit('game-ended', { leaderboard });

    updateGameState(roomCode, {
        phase: 'finished',
        finishedAt: Date.now(),
        currentOffer: null,
        offerExpiresAt: null,
        currentTurnPlayerId: null,
        turnExpiresAt: null,
        offerEligiblePlayerIds: [],
        offerResponses: {},
    });

    broadcastGameState(io, roomCode);
}

/**
 * End the offer phase and continue according to the rules.
 */
function endOfferAndContinue(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    clearOfferTimer(roomCode);

    // If all players have dealt, finish game
    if (checkGameEnd(room.gameState)) {
        finishGame(io, roomCode);
        return;
    }

    // If only one active player remains, finish them and end game
    const lastPlayer = getLastActivePlayer(room.gameState);
    if (lastPlayer) {
        finishLastPlayer(io, roomCode, lastPlayer);
        return;
    }

    // Otherwise start next round
    startNewRound(io, roomCode);
}

/**
 * Handle offer timeout - default No Deal for any non-responders (and count as a timeout)
 */
function handleOfferTimeout(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room || room.gameState.phase !== 'offer') return;

    console.log(`[Game] Offer timeout - auto No Deal for non-responders`);

    const eligible = room.gameState.offerEligiblePlayerIds || [];
    eligible.forEach((playerId) => {
        if (room.gameState.offerResponses[playerId] === undefined) {
            room.gameState.offerResponses[playerId] = false; // No Deal
            const player = room.gameState.players.get(playerId);
            if (player) {
                player.timeoutCount += 1;
            }
        }
    });

    endOfferAndContinue(io, roomCode);
}

/**
 * Start a new round
 */
function startNewRound(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    clearTurnTimer(roomCode);
    clearOfferTimer(roomCode);

    // Check if only one player remains
    const lastPlayer = getLastActivePlayer(room.gameState);
    if (lastPlayer) {
        // Reveal their box and end game
        finishLastPlayer(io, roomCode, lastPlayer);
        return;
    }

    const newRound = room.gameState.currentRound + 1;
    updateGameState(roomCode, {
        currentRound: newRound,
        boxesOpenedThisRound: [],
        phase: 'playing',
        currentOffer: null,
        offerExpiresAt: null,
        offerEligiblePlayerIds: [],
        offerResponses: {},
        currentTurnPlayerId: null,
        turnExpiresAt: null,
        // Keep currentTurnIndex as the starting index for next round
    });

    // Start turns for new round
    setCurrentTurn(io, roomCode);
}

/**
 * Finish the last remaining player
 */
function finishLastPlayer(io: Server, roomCode: string, player: Player): void {
    const room = getRoom(roomCode);
    if (!room) return;

    // They win their box value (final reveal)
    updatePlayer(roomCode, player.id, {
        hasDealt: true,
        dealAmount: player.boxValue,
        roundDealt: room.gameState.currentRound,
        isLastStanding: true,
    });

    // Mark their box as opened
    const box = room.gameState.boxes.find(b => b.number === player.boxNumber);
    if (box) {
        box.isOpened = true;
        box.openedByPlayerId = player.id;

        // Remove value from remaining values for consistency
        const valueIndex = room.gameState.remainingValues.indexOf(box.value);
        if (valueIndex > -1) {
            room.gameState.remainingValues.splice(valueIndex, 1);
            room.gameState.eliminatedValues.push(box.value);
        }
    }

    finishGame(io, roomCode);
}

/**
 * Trigger banker offer phase
 */
function triggerBankerOffer(io: Server, roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room) return;

    clearTurnTimer(roomCode);
    clearOfferTimer(roomCode);

    // Check if only one player remains
    const lastPlayer = getLastActivePlayer(room.gameState);
    if (lastPlayer) {
        finishLastPlayer(io, roomCode, lastPlayer);
        return;
    }

    // If no active players remain, finish
    if (checkGameEnd(room.gameState)) {
        finishGame(io, roomCode);
        return;
    }

    const offer = calculateBankerOffer(
        room.gameState.remainingValues,
        room.gameState.currentRound
    );

    const expiresAt = Date.now() + OFFER_TIMEOUT_MS;

    // Eligible players = active players at offer start (must respond)
    const eligiblePlayerIds = Array.from(room.gameState.players.values())
        .filter((p) => p.role === 'player' && p.boxNumber !== null && !p.hasDealt)
        .map((p) => p.id);

    updateGameState(roomCode, {
        phase: 'offer',
        currentOffer: offer,
        offerExpiresAt: expiresAt,
        offerEligiblePlayerIds: eligiblePlayerIds,
        offerResponses: {},
        currentTurnPlayerId: null,
        turnExpiresAt: null,
    });

    broadcastGameState(io, roomCode);

    // Set timeout for offer expiry - default No Deal for non-responders
    const offerTimer = setTimeout(() => handleOfferTimeout(io, roomCode), OFFER_TIMEOUT_MS);
    offerTimers.set(roomCode, offerTimer);
}

/**
 * Register all socket event handlers
 */
export function registerSocketHandlers(io: Server, socket: Socket): void {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Create Room
    socket.on('create-room', (payload: CreateRoomPayload, callback?: (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => {
        const { playerName } = payload;

        if (!playerName || playerName.trim().length === 0) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Player name is required' });
            }
            return;
        }

        const { room, playerId } = createRoom(socket.id, playerName.trim());
        socket.join(room.code);

        console.log(`[Room] Created room ${room.code} by ${playerName}`);

        if (typeof callback === 'function') {
            callback({
                success: true,
                roomCode: room.code,
                playerId,
            });
        }

        broadcastGameState(io, room.code);
    });

    // Join Room
    socket.on('join-room', (payload: JoinRoomPayload, callback?: (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => {
        const { roomCode, playerName, password, asSpectator } = payload;

        if (!playerName || playerName.trim().length === 0) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Player name is required' });
            }
            return;
        }

        if (!roomCode || roomCode.trim().length === 0) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Room code is required' });
            }
            return;
        }

        const result = joinRoom(
            roomCode.trim().toUpperCase(),
            socket.id,
            playerName.trim(),
            { password, asSpectator }
        );

        if (!result.success) {
            if (typeof callback === 'function') {
                callback({ success: false, error: result.error });
            }
            return;
        }

        socket.join(roomCode.toUpperCase());

        console.log(`[Room] ${playerName} joined room ${roomCode}${asSpectator ? ' as spectator' : ''}`);

        if (typeof callback === 'function') {
            callback({
                success: true,
                roomCode: roomCode.toUpperCase(),
                playerId: result.playerId,
            });
        }

        const code = roomCode.toUpperCase();
        broadcastGameState(io, code);
        // Ensure late-joining spectators (or reconnecting tabs that re-join) can see the current leaderboard.
        emitLeaderboardSnapshotToSocket(io, code, socket.id);
    });

    // Reconnect
    socket.on('reconnect-player', (payload: { playerId: string }, callback) => {
        const room = reconnectPlayer(payload.playerId, socket.id);
        if (room) {
            socket.join(room.code);
            console.log(`[Socket] Player ${payload.playerId} reconnected`);
            callback({ success: true, roomCode: room.code });
            broadcastGameState(io, room.code);
            // Re-send the latest leaderboard snapshot (especially important if the game already finished).
            emitLeaderboardSnapshotToSocket(io, room.code, socket.id);
        } else {
            callback({ success: false, error: 'Player not found' });
        }
    });

    // Select Box
    socket.on('select-box', (payload: SelectBoxPayload) => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room) return;

        const player = getPlayer(room.code, playerId);
        if (!player || player.role !== 'player') return;

        if (room.gameState.phase !== 'waiting' && room.gameState.phase !== 'selection') {
            return;
        }

        // Prevent changing box after the player has locked in (client UI already enforces this)
        if (player.isReady) return;

        // Validate box number
        if (!Number.isInteger(payload.boxNumber) || payload.boxNumber < 1 || payload.boxNumber > room.gameState.boxes.length) {
            return;
        }

        // Check if box is already taken
        const boxTaken = Array.from(room.gameState.players.values()).some(
            (p) => p.boxNumber === payload.boxNumber && p.id !== playerId
        );
        if (boxTaken) return;

        updatePlayer(room.code, playerId, { boxNumber: payload.boxNumber });

        console.log(`[Game] Player ${playerId} selected box ${payload.boxNumber}`);

        broadcastGameState(io, room.code);
    });

    // Player Ready
    socket.on('player-ready', () => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room) return;

        const player = getPlayer(room.code, playerId);
        if (!player || !player.boxNumber || player.role !== 'player') return;

        updatePlayer(room.code, playerId, { isReady: true });

        console.log(`[Game] Player ${playerId} is ready`);

        broadcastGameState(io, room.code);
    });

    // Start Game (Host only)
    socket.on('start-game', () => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room) return;

        // Verify host
        if (room.gameState.hostId !== playerId) {
            return;
        }

        // Check all players ready
        if (!allPlayersReady(room.gameState)) {
            return;
        }

        // Get active players for turn order
        const activePlayers = Array.from(room.gameState.players.values())
            .filter(p => p.role === 'player' && p.boxNumber !== null);

        // Create turn order from join order
        const turnOrder = activePlayers.map(p => p.id);

        // Pick random starting player
        const startIndex = Math.floor(Math.random() * turnOrder.length);

        // Assign box values to players
        room.gameState.players.forEach((player) => {
            if (player.boxNumber !== null && player.role === 'player') {
                const box = room.gameState.boxes.find((b) => b.number === player.boxNumber);
                if (box) {
                    player.boxValue = box.value;
                }
            }
        });

        updateGameState(room.code, {
            phase: 'playing',
            currentRound: 1,
            startedAt: Date.now(),
            turnOrder,
            currentTurnIndex: startIndex,
            offerEligiblePlayerIds: [],
            offerResponses: {},
        });

        console.log(`[Game] Game started in room ${room.code} with turn order: ${turnOrder.join(', ')}`);

        // Start first turn
        setCurrentTurn(io, room.code);
    });

    // Set Room Password (Host only, lobby only)
    socket.on('set-room-password', (payload: { password: string | null }, callback?: (res: { success: boolean; error?: string }) => void) => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room) {
            callback?.({ success: false, error: 'Room not found' });
            return;
        }

        if (room.gameState.hostId !== playerId) {
            callback?.({ success: false, error: 'Only the host can change the room password' });
            return;
        }

        if (room.gameState.phase !== 'waiting') {
            callback?.({ success: false, error: 'Cannot change password after the game has started' });
            return;
        }

        const raw = typeof payload.password === 'string' ? payload.password.trim() : '';
        const password = raw.length > 0 ? raw.slice(0, 64) : null;

        setRoomPassword(room.code, password);
        console.log(`[Room] Password ${password ? 'set' : 'cleared'} for room ${room.code}`);

        callback?.({ success: true });
        broadcastGameState(io, room.code);
    });

    // Get Global Leaderboard (runtime, top 100)
    socket.on('get-global-leaderboard', (_payload: unknown, callback?: (res: { success: boolean; leaderboard?: ReturnType<typeof getGlobalLeaderboard>; error?: string }) => void) => {
        try {
            const leaderboard = getGlobalLeaderboard();
            callback?.({ success: true, leaderboard });
        } catch (err) {
            callback?.({ success: false, error: 'Could not load global leaderboard' });
        }
    });

    // Open Box (single box per turn)
    socket.on('open-box', (payload: { boxNumber: number }) => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room || room.gameState.phase !== 'playing') return;

        // Verify it's this player's turn
        if (room.gameState.currentTurnPlayerId !== playerId) {
            console.log(`[Game] Not ${playerId}'s turn`);
            return;
        }

        const player = getPlayer(room.code, playerId);
        if (!player || player.hasDealt || player.role !== 'player') return;

        // If the round is already complete, ignore any further opens (prevents double-open exploits)
        const boxesToOpenForThisRound = getBoxesToOpenForRound(room.gameState.currentRound);
        if (room.gameState.boxesOpenedThisRound.length >= boxesToOpenForThisRound) {
            return;
        }

        const box = room.gameState.boxes.find((b) => b.number === payload.boxNumber);
        if (!box || box.isOpened) return;

        // Can't open own box or another player's box
        const boxOwner = Array.from(room.gameState.players.values()).find(
            (p) => p.boxNumber === payload.boxNumber
        );
        if (boxOwner) return;

        // Clear turn timer
        clearTurnTimer(room.code);

        // Open the box
        box.isOpened = true;
        box.openedByPlayerId = playerId;

        // Update remaining/eliminated values
        const valueIndex = room.gameState.remainingValues.indexOf(box.value);
        if (valueIndex > -1) {
            room.gameState.remainingValues.splice(valueIndex, 1);
            room.gameState.eliminatedValues.push(box.value);
        }

        room.gameState.boxesOpenedThisRound.push(payload.boxNumber);

        console.log(`[Game] Player ${playerId} opened box ${payload.boxNumber} (value: £${box.value})`);

        // Check if round is complete
        const boxesToOpen = boxesToOpenForThisRound;
        const roundComplete = room.gameState.boxesOpenedThisRound.length >= boxesToOpen || !hasOpenableBoxes(room.gameState);

        if (roundComplete) {
            // Advance starting index for next round so we continue rotation fairly
            const nextStartIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex + 1);
            updateGameState(room.code, {
                currentTurnIndex: nextStartIdx !== -1 ? nextStartIdx : room.gameState.currentTurnIndex,
                // Clear turn ownership during the short pause before the banker offer
                currentTurnPlayerId: null,
                turnExpiresAt: null,
            });

            // Broadcast with revealed box (and cleared turn)
            broadcastGameState(io, room.code, { boxNumber: payload.boxNumber, value: box.value });

            // Round complete, trigger banker offer after delay
            setTimeout(() => {
                triggerBankerOffer(io, room.code);
            }, 1500);
        } else {
            // Broadcast with revealed box
            broadcastGameState(io, room.code, { boxNumber: payload.boxNumber, value: box.value });

            // Move to next player's turn
            const nextIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex + 1);
            if (nextIdx !== -1) {
                updateGameState(room.code, { currentTurnIndex: nextIdx });
                setCurrentTurn(io, room.code);
            }
        }
    });

    // Legacy: Open Boxes (batch - deprecated, use 'open-box' instead)
    // Kept for backwards compatibility but opens only first box
    socket.on('open-boxes', (payload: OpenBoxesPayload) => {
        if (payload.boxNumbers.length > 0) {
            // Directly call the open-box logic for the first box
            const playerId = getPlayerIdFromSocket(socket.id);
            if (!playerId) return;

            const room = getRoomByPlayerId(playerId);
            if (!room || room.gameState.phase !== 'playing') return;

            // Verify it's this player's turn
            if (room.gameState.currentTurnPlayerId !== playerId) {
                console.log(`[Game] Not ${playerId}'s turn for batch open`);
                return;
            }

            const player = getPlayer(room.code, playerId);
            if (!player || player.hasDealt || player.role !== 'player') return;

            // If the round is already complete, ignore any further opens (prevents double-open exploits)
            const boxesToOpenForThisRound = getBoxesToOpenForRound(room.gameState.currentRound);
            if (room.gameState.boxesOpenedThisRound.length >= boxesToOpenForThisRound) {
                return;
            }

            const boxNumber = payload.boxNumbers[0];
            const box = room.gameState.boxes.find((b) => b.number === boxNumber);
            if (!box || box.isOpened) return;

            // Can't open own box or another player's box
            const boxOwner = Array.from(room.gameState.players.values()).find(
                (p) => p.boxNumber === boxNumber
            );
            if (boxOwner) return;

            // Clear turn timer
            clearTurnTimer(room.code);

            // Open the box
            box.isOpened = true;
            box.openedByPlayerId = playerId;

            // Update remaining/eliminated values
            const valueIndex = room.gameState.remainingValues.indexOf(box.value);
            if (valueIndex > -1) {
                room.gameState.remainingValues.splice(valueIndex, 1);
                room.gameState.eliminatedValues.push(box.value);
            }

            room.gameState.boxesOpenedThisRound.push(boxNumber);

            console.log(`[Game] Player ${playerId} opened box ${boxNumber} via legacy batch (value: £${box.value})`);

            // Broadcast with revealed box
            // Determine if round is complete BEFORE broadcasting so we can clear the turn in the same update
            const boxesToOpen = boxesToOpenForThisRound;
            const roundComplete = room.gameState.boxesOpenedThisRound.length >= boxesToOpen || !hasOpenableBoxes(room.gameState);
            if (roundComplete) {
                const nextStartIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex + 1);
                updateGameState(room.code, {
                    currentTurnIndex: nextStartIdx !== -1 ? nextStartIdx : room.gameState.currentTurnIndex,
                    currentTurnPlayerId: null,
                    turnExpiresAt: null,
                });
            }

            broadcastGameState(io, room.code, { boxNumber, value: box.value });

            // Check if round is complete
            if (roundComplete) {
                setTimeout(() => {
                    triggerBankerOffer(io, room.code);
                }, 1500);
            } else {
                const nextIdx = getNextActivePlayerIndex(room.gameState, room.gameState.currentTurnIndex + 1);
                if (nextIdx !== -1) {
                    updateGameState(room.code, { currentTurnIndex: nextIdx });
                    setCurrentTurn(io, room.code);
                }
            }
        }
    });

    // Deal Response
    socket.on('deal-response', (payload: DealResponsePayload) => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room || room.gameState.phase !== 'offer') return;

        const player = getPlayer(room.code, playerId);
        if (!player || player.hasDealt || player.role !== 'player') return;

        // Only one response per offer per player
        if (room.gameState.offerResponses[playerId] !== undefined) return;

        // Only eligible players can respond (active at offer start)
        if (!room.gameState.offerEligiblePlayerIds.includes(playerId)) return;

        room.gameState.offerResponses[playerId] = !!payload.accepted;

        if (payload.accepted && room.gameState.currentOffer !== null) {
            // Player took the deal
            const points = calculatePoints({
                finalWinnings: room.gameState.currentOffer,
                finalBoxValue: player.boxValue || 0,
                roundDealt: room.gameState.currentRound,
                isLastStanding: false,
                isHighestWinnings: false, // Will be recalculated at game end
                timeoutCount: player.timeoutCount
            });

            updatePlayer(room.code, playerId, {
                hasDealt: true,
                dealAmount: room.gameState.currentOffer,
                roundDealt: room.gameState.currentRound,
                isLastStanding: false,
                points,
            });

            // Mark their box as opened and remove value from remaining
            const box = room.gameState.boxes.find(b => b.number === player.boxNumber);
            if (box && !box.isOpened) {
                box.isOpened = true;
                box.openedByPlayerId = playerId;

                // Remove value from remaining values
                const valueIndex = room.gameState.remainingValues.indexOf(box.value);
                if (valueIndex > -1) {
                    room.gameState.remainingValues.splice(valueIndex, 1);
                    room.gameState.eliminatedValues.push(box.value);
                }
            }

            console.log(`[Game] Player ${playerId} accepted deal: £${room.gameState.currentOffer}`);

            // Remove from turn order
            const turnIdx = room.gameState.turnOrder.indexOf(playerId);
            if (turnIdx > -1) {
                room.gameState.turnOrder.splice(turnIdx, 1);
                // Keep currentTurnIndex stable if removal happened before it
                if (turnIdx < room.gameState.currentTurnIndex) {
                    room.gameState.currentTurnIndex = Math.max(0, room.gameState.currentTurnIndex - 1);
                }
            }
        } else {
            console.log(`[Game] Player ${playerId} rejected deal`);
        }

        // Update everyone with new state (and in-game leaderboard)
        broadcastGameState(io, room.code);
        emitLeaderboardUpdate(io, room.code);

        // If everyone who was eligible for this offer has responded, continue.
        const eligible = room.gameState.offerEligiblePlayerIds || [];
        const allResponded = eligible.every((pid) => room.gameState.offerResponses[pid] !== undefined);
        if (allResponded) {
            endOfferAndContinue(io, room.code);
        }
    });

    // Chat Message
    socket.on('chat-message', (payload: ChatMessagePayload) => {
        const playerId = getPlayerIdFromSocket(socket.id);
        if (!playerId) return;

        const room = getRoomByPlayerId(playerId);
        if (!room) return;

        const player = getPlayer(room.code, playerId);
        if (!player) return;

        // Spectators can't chat by default
        if (player.role === 'spectator') {
            return;
        }

        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            roomCode: room.code,
            senderId: playerId,
            senderName: player.name,
            content: payload.content.slice(0, 500), // Limit message length
            timestamp: Date.now(),
        };

        addChatMessage(message);

        io.to(room.code).emit('chat-message', message);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        const result = handleDisconnect(socket.id);
        if (result) {
            io.to(result.roomCode).emit('player-left', {
                playerId: result.playerId,
                removed: result.removed
            });
            broadcastGameState(io, result.roomCode);
        }
    });
}
