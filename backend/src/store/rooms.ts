/**
 * Room store - In-memory storage for game rooms
 * 
 * Uses Maps for O(1) lookup. Designed to be replaceable
 * with a database (Supabase/Postgres) later.
 */

import { Room, GameState, Player, Box, ChatMessage, PlayerRole } from './types';
import { BOX_VALUES, ROOM_CODE_LENGTH, sanitiseName, MAX_PLAYERS_PER_ROOM } from '../game/constants';

// In-memory stores
const rooms: Map<string, Room> = new Map();
const playerToRoom: Map<string, string> = new Map(); // playerId -> roomCode
const socketToPlayer: Map<string, string> = new Map(); // socketId -> playerId

// Global leaderboard (top 100, runtime only)
interface GlobalLeaderboardEntry {
    playerId: string;
    playerName: string;
    publicId: string;
    totalPoints: number;
    gamesPlayed: number;
}
const globalLeaderboard: Map<string, GlobalLeaderboardEntry> = new Map();

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (rooms.has(code)) {
        return generateRoomCode();
    }
    return code;
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Create initial boxes with shuffled values
 */
function createInitialBoxes(): Box[] {
    const shuffledValues = shuffleArray(BOX_VALUES);
    return shuffledValues.map((value, index) => ({
        number: index + 1,
        value,
        isOpened: false,
        openedByPlayerId: null,
    }));
}

/**
 * Create a new room
 */
export function createRoom(hostSocketId: string, hostName: string): { room: Room; playerId: string } {
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();

    const host: Player = {
        id: playerId,
        socketId: hostSocketId,
        name: sanitiseName(hostName),
        isHost: true,
        isReady: false,
        role: 'player',
        boxNumber: null,
        hasDealt: false,
        dealAmount: null,
        boxValue: null,
        roundDealt: null,
        isLastStanding: false,
        points: 0,
        timeoutCount: 0,
        isConnected: true,
    };

    const gameState: GameState = {
        roomCode,
        phase: 'waiting',
        players: new Map([[playerId, host]]),
        boxes: createInitialBoxes(),
        currentRound: 0,
        boxesOpenedThisRound: [],
        remainingValues: [...BOX_VALUES],
        eliminatedValues: [],
        currentOffer: null,
        offerExpiresAt: null,
        offerEligiblePlayerIds: [],
        offerResponses: {},
        // Turn order (initialised on game start)
        turnOrder: [],
        currentTurnIndex: 0,
        currentTurnPlayerId: null,
        turnExpiresAt: null,
        // Room settings
        hostId: playerId,
        password: null,
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null,
    };

    const room: Room = {
        code: roomCode,
        gameState,
    };

    rooms.set(roomCode, room);
    playerToRoom.set(playerId, roomCode);
    socketToPlayer.set(hostSocketId, playerId);

    return { room, playerId };
}

/**
 * Join an existing room
 */
export function joinRoom(
    roomCode: string,
    socketId: string,
    playerName: string,
    options: { password?: string; asSpectator?: boolean } = {}
): { success: boolean; playerId?: string; error?: string; room?: Room } {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    // Check password if set
    if (room.gameState.password && room.gameState.password !== options.password) {
        return { success: false, error: 'Incorrect password' };
    }

    const role: PlayerRole = options.asSpectator ? 'spectator' : 'player';

    // Players can only join during waiting phase
    if (role === 'player' && room.gameState.phase !== 'waiting') {
        return { success: false, error: 'Game already in progress' };
    }

    // Count active players (not spectators)
    const playerCount = Array.from(room.gameState.players.values())
        .filter(p => p.role === 'player').length;

    if (role === 'player' && playerCount >= MAX_PLAYERS_PER_ROOM) {
        return { success: false, error: 'Room is full' };
    }

    const playerId = generatePlayerId();

    const player: Player = {
        id: playerId,
        socketId,
        name: sanitiseName(playerName),
        isHost: false,
        isReady: role === 'spectator', // Spectators are always "ready"
        role,
        boxNumber: null,
        hasDealt: role === 'spectator', // Spectators don't participate
        dealAmount: null,
        boxValue: null,
        roundDealt: null,
        isLastStanding: false,
        points: 0,
        timeoutCount: 0,
        isConnected: true,
    };

    room.gameState.players.set(playerId, player);
    playerToRoom.set(playerId, roomCode.toUpperCase());
    socketToPlayer.set(socketId, playerId);

    return { success: true, playerId, room };
}

/**
 * Get room by code
 */
export function getRoom(roomCode: string): Room | undefined {
    return rooms.get(roomCode.toUpperCase());
}

/**
 * Get room by player ID
 */
export function getRoomByPlayerId(playerId: string): Room | undefined {
    const roomCode = playerToRoom.get(playerId);
    if (!roomCode) return undefined;
    return rooms.get(roomCode);
}

/**
 * Get player ID from socket ID
 */
export function getPlayerIdFromSocket(socketId: string): string | undefined {
    return socketToPlayer.get(socketId);
}

/**
 * Get player from room
 */
export function getPlayer(roomCode: string, playerId: string): Player | undefined {
    const room = rooms.get(roomCode);
    if (!room) return undefined;
    return room.gameState.players.get(playerId);
}

/**
 * Update player in room
 */
export function updatePlayer(roomCode: string, playerId: string, updates: Partial<Player>): boolean {
    const room = rooms.get(roomCode);
    if (!room) return false;

    const player = room.gameState.players.get(playerId);
    if (!player) return false;

    Object.assign(player, updates);
    return true;
}

/**
 * Handle player disconnect - marks as disconnected but keeps in game (AFK)
 * This supports reconnect-by-playerId at any phase.
 */
export function handleDisconnect(socketId: string): { roomCode: string; playerId: string; removed: boolean } | undefined {
    const playerId = socketToPlayer.get(socketId);
    if (!playerId) return undefined;

    const roomCode = playerToRoom.get(playerId);
    if (!roomCode) return undefined;

    const room = rooms.get(roomCode);
    if (!room) return undefined;

    const player = room.gameState.players.get(playerId);
    if (!player) return undefined;

    // Mark as disconnected but keep in game (including lobby)
    player.isConnected = false;
    socketToPlayer.delete(socketId);

    return { roomCode, playerId, removed: false };
}

/**
 * Legacy removePlayer - calls handleDisconnect for backwards compatibility
 */
export function removePlayer(socketId: string): { roomCode: string; playerId: string } | undefined {
    const result = handleDisconnect(socketId);
    if (!result) return undefined;
    return { roomCode: result.roomCode, playerId: result.playerId };
}

/**
 * Reconnect a player by playerId
 */
export function reconnectPlayer(playerId: string, newSocketId: string): Room | undefined {
    const roomCode = playerToRoom.get(playerId);
    if (!roomCode) return undefined;

    const room = rooms.get(roomCode);
    if (!room) return undefined;

    const player = room.gameState.players.get(playerId);
    if (!player) return undefined;

    // Update socket mapping
    player.socketId = newSocketId;
    player.isConnected = true;
    socketToPlayer.set(newSocketId, playerId);

    return room;
}

/**
 * Update game state
 */
export function updateGameState(roomCode: string, updates: Partial<GameState>): boolean {
    const room = rooms.get(roomCode);
    if (!room) return false;

    Object.assign(room.gameState, updates);
    return true;
}

/**
 * Get all socket IDs in a room
 */
export function getRoomSocketIds(roomCode: string): string[] {
    const room = rooms.get(roomCode);
    if (!room) return [];

    return Array.from(room.gameState.players.values()).map((p) => p.socketId);
}

// Chat message storage (limited to last 100 per room)
const chatMessages: Map<string, ChatMessage[]> = new Map();

/**
 * Add chat message to room
 */
export function addChatMessage(message: ChatMessage): void {
    const messages = chatMessages.get(message.roomCode) || [];
    messages.push(message);

    // Keep only last 100 messages
    if (messages.length > 100) {
        messages.shift();
    }

    chatMessages.set(message.roomCode, messages);
}

/**
 * Get chat messages for room
 */
export function getChatMessages(roomCode: string): ChatMessage[] {
    return chatMessages.get(roomCode) || [];
}

// ============================================
// Global Leaderboard Functions
// ============================================

/**
 * Update global leaderboard with player results
 */
export function updateGlobalLeaderboard(playerId: string, playerName: string, pointsEarned: number): void {
    const publicId = `${playerName}#${playerId.slice(-4).toUpperCase()}`;
    const existing = globalLeaderboard.get(playerId);
    if (existing) {
        existing.totalPoints += pointsEarned;
        existing.gamesPlayed += 1;
        existing.playerName = playerName; // Update name in case it changed
        existing.publicId = publicId;
    } else {
        globalLeaderboard.set(playerId, {
            playerId,
            playerName,
            publicId,
            totalPoints: pointsEarned,
            gamesPlayed: 1,
        });
    }
}

/**
 * Get top 100 global leaderboard
 */
export interface GlobalLeaderboardEntryPublic {
    rank: number;
    publicId: string;
    playerName: string;
    totalPoints: number;
    gamesPlayed: number;
}

export function getGlobalLeaderboard(): GlobalLeaderboardEntryPublic[] {
    return Array.from(globalLeaderboard.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 100)
        .map((entry, idx) => ({
            rank: idx + 1,
            publicId: entry.publicId,
            playerName: entry.playerName,
            totalPoints: entry.totalPoints,
            gamesPlayed: entry.gamesPlayed,
        }));
}

/**
 * Set room password
 */
export function setRoomPassword(roomCode: string, password: string | null): boolean {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return false;
    room.gameState.password = password;
    return true;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// Cleanup TTLs (ms). These are intentionally conservative and only apply to rooms that
// are safe to delete without leaving active timers behind (waiting/selection/finished).
const ROOM_WAITING_TTL_MS = parsePositiveInt(process.env.ROOM_WAITING_TTL_MS, 12 * 60 * 60 * 1000); // 12h
const ROOM_SELECTION_TTL_MS = parsePositiveInt(process.env.ROOM_SELECTION_TTL_MS, 12 * 60 * 60 * 1000); // 12h
const ROOM_FINISHED_TTL_MS = parsePositiveInt(process.env.ROOM_FINISHED_TTL_MS, 2 * 60 * 60 * 1000); // 2h

function deleteRoom(roomCode: string): boolean {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    if (!room) return false;

    // Remove player mappings for this room
    room.gameState.players.forEach((p) => {
        playerToRoom.delete(p.id);
        // Best-effort: if the socket is still mapped, remove it as well
        socketToPlayer.delete(p.socketId);
    });

    // Remove chat messages for this room
    chatMessages.delete(code);

    // Finally remove the room itself
    rooms.delete(code);
    return true;
}

/**
 * Cleanup stale rooms from the in-memory store.
 *
 * This is a safety valve for long-running production instances. It does NOT attempt to
 * clean up active games (playing/offer) because those phases have live timers managed
 * elsewhere. Instead it removes:
 * - waiting rooms older than ROOM_WAITING_TTL_MS
 * - selection rooms older than ROOM_SELECTION_TTL_MS
 * - finished rooms older than ROOM_FINISHED_TTL_MS
 */
export function cleanupRooms(now: number = Date.now()): { removedRooms: number } {
    let removedRooms = 0;

    for (const [code, room] of rooms.entries()) {
        const { phase, createdAt, finishedAt, startedAt } = room.gameState;

        if (phase === 'finished') {
            const finishedAge = finishedAt ? now - finishedAt : now - (startedAt || createdAt);
            if (finishedAge > ROOM_FINISHED_TTL_MS) {
                if (deleteRoom(code)) removedRooms += 1;
            }
            continue;
        }

        if (phase === 'waiting') {
            if (now - createdAt > ROOM_WAITING_TTL_MS) {
                if (deleteRoom(code)) removedRooms += 1;
            }
            continue;
        }

        if (phase === 'selection') {
            if (now - createdAt > ROOM_SELECTION_TTL_MS) {
                if (deleteRoom(code)) removedRooms += 1;
            }
            continue;
        }
    }

    return { removedRooms };
}

