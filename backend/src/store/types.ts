/**
 * TypeScript interfaces for game state
 */

export type PlayerRole = 'player' | 'spectator';

export interface Player {
    id: string;
    socketId: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
    role: PlayerRole;
    boxNumber: number | null;
    hasDealt: boolean;
    dealAmount: number | null;
    boxValue: number | null; // The value inside their box (revealed at end or when dealt)
    roundDealt: number | null; // Round number when player dealt (or final round if last standing)
    isLastStanding: boolean; // True only for the final remaining active player
    points: number;
    timeoutCount: number; // Number of times player let timer expire
    isConnected: boolean; // False when disconnected but still in game
}

export interface Box {
    number: number;
    value: number;
    isOpened: boolean;
    openedByPlayerId: string | null;
}

export type GamePhase =
    | 'waiting'      // In lobby, waiting for players
    | 'selection'    // Players selecting their boxes
    | 'playing'      // Game in progress
    | 'offer'        // Banker offer phase
    | 'finished';    // Game complete

export interface GameState {
    roomCode: string;
    phase: GamePhase;
    players: Map<string, Player>;
    boxes: Box[];
    currentRound: number;
    boxesOpenedThisRound: number[];
    remainingValues: number[];
    eliminatedValues: number[];
    currentOffer: number | null;
    offerExpiresAt: number | null;
    // Offer response tracking (per offer)
    offerEligiblePlayerIds: string[]; // Active players who must respond to the current offer
    offerResponses: Record<string, boolean>; // playerId -> accepted (true=Deal, false=No Deal)
    // Turn order system
    turnOrder: string[]; // Player IDs in rotation order
    currentTurnIndex: number; // Index into turnOrder
    currentTurnPlayerId: string | null;
    turnExpiresAt: number | null;
    // Room settings
    hostId: string;
    password: string | null; // Optional room password
    createdAt: number;
    startedAt: number | null;
    finishedAt: number | null;
}

export interface Room {
    code: string;
    gameState: GameState;
}

export interface ChatMessage {
    id: string;
    roomCode: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
}

// Socket event payloads

export interface CreateRoomPayload {
    playerName: string;
}

export interface JoinRoomPayload {
    roomCode: string;
    playerName: string;
    password?: string;
    asSpectator?: boolean;
}

export interface SelectBoxPayload {
    boxNumber: number;
}

export interface OpenBoxesPayload {
    boxNumbers: number[];
}

export interface DealResponsePayload {
    accepted: boolean;
}

export interface ChatMessagePayload {
    content: string;
}

// Socket response types

export interface RoomCreatedResponse {
    roomCode: string;
    playerId: string;
}

export interface JoinRoomResponse {
    success: boolean;
    playerId?: string;
    error?: string;
}

export interface GameStateUpdate {
    phase: GamePhase;
    players: PlayerPublicInfo[];
    boxes: BoxPublicInfo[];
    currentRound: number;
    boxesToOpenThisRound: number;
    boxesOpenedThisRound: number[];
    remainingValues: number[];
    eliminatedValues: number[];
    currentOffer: number | null;
    offerExpiresAt: number | null;
    // Turn order info
    currentTurnPlayerId: string | null;
    turnExpiresAt: number | null;
    recentlyOpenedBox?: { boxNumber: number; value: number };
}

export interface PlayerPublicInfo {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
    role: PlayerRole;
    boxNumber: number | null;
    hasDealt: boolean;
    dealAmount: number | null;
    isActive: boolean;
    isConnected: boolean;
}

export interface BoxPublicInfo {
    number: number;
    isOpened: boolean;
    value: number | null; // Only shown if opened
    isPlayerBox: boolean;
    ownerId: string | null;
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    amount: number;
    rank: number;
    wasBoxValue: boolean; // true if final box value, false if deal amount
}
