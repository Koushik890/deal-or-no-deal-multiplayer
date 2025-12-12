/**
 * Game Context - Global game state management
 * 
 * Provides game state and socket actions to all components
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

// Types matching backend
export type PlayerRole = 'player' | 'spectator';

export interface Player {
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

export interface Box {
    number: number;
    isOpened: boolean;
    value: number | null;
    isPlayerBox: boolean;
    ownerId: string | null;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isOwn?: boolean;
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    amount: number;
    points: number;
    /** True if winnings came from final box reveal (last player standing), not from taking a Deal. */
    wasBoxValue: boolean;
    rank: number;
}

export interface GlobalLeaderboardEntry {
    rank: number;
    publicId: string;
    playerName: string;
    totalPoints: number;
    gamesPlayed: number;
}

export type GamePhase = 'waiting' | 'selection' | 'playing' | 'offer' | 'finished';

export interface GameState {
    // Connection
    isConnected: boolean;
    playerId: string | null;
    playerName: string | null;
    roomCode: string | null;

    // Game state
    phase: GamePhase;
    players: Player[];
    boxes: Box[];
    currentRound: number;
    boxesToOpenThisRound: number;
    boxesOpenedThisRound: number[];
    remainingValues: number[];
    eliminatedValues: number[];
    currentOffer: number | null;
    offerExpiresAt: number | null;

    // Turn order
    currentTurnPlayerId: string | null;
    turnExpiresAt: number | null;
    isMyTurn: boolean;

    // UI state
    recentlyOpenedBox: { boxNumber: number; value: number } | null;
    chatMessages: ChatMessage[];
    leaderboard: LeaderboardEntry[];
    error: string | null;
}

type GameAction =
    | { type: 'SET_CONNECTED'; payload: boolean }
    | { type: 'SET_PLAYER'; payload: { playerId: string; playerName: string } }
    | { type: 'SET_ROOM'; payload: string }
    | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameState> }
    | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
    | { type: 'SET_LEADERBOARD'; payload: LeaderboardEntry[] }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET' };

const initialState: GameState = {
    isConnected: false,
    playerId: null,
    playerName: null,
    roomCode: null,
    phase: 'waiting',
    players: [],
    boxes: [],
    currentRound: 0,
    boxesToOpenThisRound: 0,
    boxesOpenedThisRound: [],
    remainingValues: [],
    eliminatedValues: [],
    currentOffer: null,
    offerExpiresAt: null,
    currentTurnPlayerId: null,
    turnExpiresAt: null,
    isMyTurn: false,
    recentlyOpenedBox: null,
    chatMessages: [],
    leaderboard: [],
    error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_CONNECTED':
            return { ...state, isConnected: action.payload };
        case 'SET_PLAYER':
            return {
                ...state,
                playerId: action.payload.playerId,
                playerName: action.payload.playerName
            };
        case 'SET_ROOM':
            // Room-scoped state should never leak between rooms (e.g., stale "This Game" leaderboard).
            // Keep connection + player identity, but reset all game/UI state for the new room.
            return {
                ...state,
                roomCode: action.payload,
                phase: 'waiting',
                players: [],
                boxes: [],
                currentRound: 0,
                boxesToOpenThisRound: 0,
                boxesOpenedThisRound: [],
                remainingValues: [],
                eliminatedValues: [],
                currentOffer: null,
                offerExpiresAt: null,
                currentTurnPlayerId: null,
                turnExpiresAt: null,
                isMyTurn: false,
                recentlyOpenedBox: null,
                chatMessages: [],
                leaderboard: [],
                error: null,
            };
        case 'UPDATE_GAME_STATE':
            // Merge authoritative server state, and keep local identity (playerName) in sync
            // with the server-sanitised name for this player (profanity filter etc.).
            // This prevents UI inconsistencies where the top bar shows the raw entered name
            // while the player list shows the sanitised name from the server.
            const nextState = { ...state, ...action.payload };
            if (action.payload.players && state.playerId) {
                const me = action.payload.players.find((p) => p.id === state.playerId);
                if (me) {
                    nextState.playerName = me.name;
                }
            }
            return nextState;
        case 'ADD_CHAT_MESSAGE':
            return {
                ...state,
                chatMessages: [...state.chatMessages, action.payload].slice(-100)
            };
        case 'SET_LEADERBOARD':
            return { ...state, leaderboard: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

interface GameContextValue {
    state: GameState;
    // Actions
    createRoom: (playerName: string) => Promise<{ success: boolean; roomCode?: string; error?: string }>;
    joinRoom: (roomCode: string, playerName: string, options?: { password?: string; asSpectator?: boolean }) => Promise<{ success: boolean; error?: string }>;
    setRoomPassword: (password: string | null) => Promise<{ success: boolean; error?: string }>;
    getGlobalLeaderboard: () => Promise<{ success: boolean; leaderboard?: GlobalLeaderboardEntry[]; error?: string }>;
    selectBox: (boxNumber: number) => void;
    setReady: () => void;
    startGame: () => void;
    openBox: (boxNumber: number) => void;
    openBoxes: (boxNumbers: number[]) => void;
    respondToDeal: (accepted: boolean) => void;
    sendChatMessage: (content: string) => void;
    leaveRoom: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const { socket, isConnected, emit, on } = useSocket();
    // When Socket.io reconnects it gets a new socket id. We must re-associate that
    // socket with the existing playerId on the server, otherwise game updates/actions
    // silently stop working after transient disconnects.
    const lastReconnectedSocketIdRef = useRef<string | null>(null);
    const reconnectInFlightRef = useRef(false);

    // Use sessionStorage so multiple tabs can represent different players during local testing.
    // Still supports refresh/reconnect within the same tab.
    const STORAGE_PLAYER_ID = 'dond_player_id';
    const STORAGE_PLAYER_NAME = 'dond_player_name';
    const STORAGE_ROOM_CODE = 'dond_room_code';

    // Update connection state
    useEffect(() => {
        dispatch({ type: 'SET_CONNECTED', payload: isConnected });
    }, [isConnected]);

    // Set up event listeners
    useEffect(() => {
        if (!socket) return;

        const unsubscribeGameState = on<{
            phase: GamePhase;
            players: Player[];
            boxes: Box[];
            currentRound: number;
            boxesToOpenThisRound: number;
            boxesOpenedThisRound: number[];
            remainingValues: number[];
            eliminatedValues: number[];
            currentOffer: number | null;
            offerExpiresAt: number | null;
            currentTurnPlayerId: string | null;
            turnExpiresAt: number | null;
            recentlyOpenedBox?: { boxNumber: number; value: number };
        }>('game-state-update', (data) => {
            dispatch({
                type: 'UPDATE_GAME_STATE',
                payload: {
                    phase: data.phase,
                    players: data.players,
                    boxes: data.boxes,
                    currentRound: data.currentRound,
                    boxesToOpenThisRound: data.boxesToOpenThisRound,
                    boxesOpenedThisRound: data.boxesOpenedThisRound,
                    remainingValues: data.remainingValues,
                    eliminatedValues: data.eliminatedValues,
                    currentOffer: data.currentOffer,
                    offerExpiresAt: data.offerExpiresAt,
                    currentTurnPlayerId: data.currentTurnPlayerId,
                    turnExpiresAt: data.turnExpiresAt,
                    recentlyOpenedBox: data.recentlyOpenedBox || null,
                },
            });
        });

        const unsubscribeChat = on<ChatMessage>('chat-message', (message) => {
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
        });

        const unsubscribeGameEnded = on<{ leaderboard: LeaderboardEntry[] }>('game-ended', (data) => {
            dispatch({ type: 'SET_LEADERBOARD', payload: data.leaderboard });
        });

        const unsubscribeLeaderboardUpdate = on<{ leaderboard: LeaderboardEntry[] }>('leaderboard-update', (data) => {
            dispatch({ type: 'SET_LEADERBOARD', payload: data.leaderboard });
        });

        const unsubscribePlayerLeft = on<{ playerId: string }>('player-left', (data) => {
            console.log('[Game] Player left:', data.playerId);
        });

        return () => {
            unsubscribeGameState();
            unsubscribeChat();
            unsubscribeGameEnded();
            unsubscribeLeaderboardUpdate();
            unsubscribePlayerLeft();
        };
    }, [socket, on]);

    // Reconnect to an existing player session whenever the transport connects/reconnects.
    // This covers:
    // - page refresh (state resets, sessionStorage persists)
    // - transient network drops (state.playerId stays set, but socket.id changes)
    useEffect(() => {
        if (!socket || !isConnected) return;
        if (typeof window === 'undefined') return;

        const storedPlayerId = sessionStorage.getItem(STORAGE_PLAYER_ID);
        const storedPlayerName = sessionStorage.getItem(STORAGE_PLAYER_NAME);

        if (!storedPlayerId) return;
        if (!socket.id) return;

        // Ensure we only attempt once per socket connection.
        if (lastReconnectedSocketIdRef.current === socket.id) return;
        if (reconnectInFlightRef.current) return;

        reconnectInFlightRef.current = true;

        emit('reconnect-player', { playerId: storedPlayerId }, (response: { success: boolean; roomCode?: string; error?: string }) => {
            reconnectInFlightRef.current = false;

            if (response.success && response.roomCode) {
                lastReconnectedSocketIdRef.current = socket.id || null;
                dispatch({
                    type: 'SET_PLAYER',
                    payload: {
                        playerId: storedPlayerId,
                        playerName: storedPlayerName || state.playerName || 'Player',
                    },
                });
                dispatch({ type: 'SET_ROOM', payload: response.roomCode.toUpperCase() });
            } else {
                // Stale session, clear and allow the app to fall back to the home screen.
                sessionStorage.removeItem(STORAGE_PLAYER_ID);
                sessionStorage.removeItem(STORAGE_PLAYER_NAME);
                sessionStorage.removeItem(STORAGE_ROOM_CODE);
                lastReconnectedSocketIdRef.current = null;
                dispatch({ type: 'RESET' });
            }
        });
    }, [socket, isConnected, emit, state.playerName]);

    // Actions
    const createRoom = useCallback(async (playerName: string): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
        return new Promise((resolve) => {
            emit('create-room', { playerName }, (response: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
                if (response.success && response.roomCode && response.playerId) {
                    dispatch({ type: 'SET_PLAYER', payload: { playerId: response.playerId, playerName } });
                    dispatch({ type: 'SET_ROOM', payload: response.roomCode });
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(STORAGE_PLAYER_ID, response.playerId);
                        sessionStorage.setItem(STORAGE_PLAYER_NAME, playerName);
                        sessionStorage.setItem(STORAGE_ROOM_CODE, response.roomCode);
                    }
                    resolve({ success: true, roomCode: response.roomCode });
                } else {
                    resolve({ success: false, error: response.error || 'Failed to create room' });
                }
            });
        });
    }, [emit]);

    const joinRoom = useCallback(async (
        roomCode: string,
        playerName: string,
        options: { password?: string; asSpectator?: boolean } = {}
    ): Promise<{ success: boolean; error?: string }> => {
        return new Promise((resolve) => {
            emit('join-room', { roomCode, playerName, ...options }, (response: { success: boolean; playerId?: string; error?: string }) => {
                if (response.success && response.playerId) {
                    dispatch({ type: 'SET_PLAYER', payload: { playerId: response.playerId, playerName } });
                    dispatch({ type: 'SET_ROOM', payload: roomCode.toUpperCase() });
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(STORAGE_PLAYER_ID, response.playerId);
                        sessionStorage.setItem(STORAGE_PLAYER_NAME, playerName);
                        sessionStorage.setItem(STORAGE_ROOM_CODE, roomCode.toUpperCase());
                    }
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: response.error || 'Failed to join room' });
                }
            });
        });
    }, [emit]);

    const setRoomPassword = useCallback(async (password: string | null): Promise<{ success: boolean; error?: string }> => {
        return new Promise((resolve) => {
            emit('set-room-password', { password }, (response: { success: boolean; error?: string }) => {
                if (response.success) resolve({ success: true });
                else resolve({ success: false, error: response.error || 'Failed to set password' });
            });
        });
    }, [emit]);

    const getGlobalLeaderboard = useCallback(async (): Promise<{ success: boolean; leaderboard?: GlobalLeaderboardEntry[]; error?: string }> => {
        return new Promise((resolve) => {
            emit('get-global-leaderboard', {}, (response: { success: boolean; leaderboard?: GlobalLeaderboardEntry[]; error?: string }) => {
                if (response.success && response.leaderboard) {
                    resolve({ success: true, leaderboard: response.leaderboard });
                } else {
                    resolve({ success: false, error: response.error || 'Failed to load global leaderboard' });
                }
            });
        });
    }, [emit]);

    const selectBox = useCallback((boxNumber: number) => {
        emit('select-box', { boxNumber });
    }, [emit]);

    const setReady = useCallback(() => {
        emit('player-ready');
    }, [emit]);

    const startGame = useCallback(() => {
        emit('start-game');
    }, [emit]);

    const openBox = useCallback((boxNumber: number) => {
        emit('open-box', { boxNumber });
    }, [emit]);

    const openBoxes = useCallback((boxNumbers: number[]) => {
        emit('open-boxes', { boxNumbers });
    }, [emit]);

    const respondToDeal = useCallback((accepted: boolean) => {
        emit('deal-response', { accepted });
    }, [emit]);

    const sendChatMessage = useCallback((content: string) => {
        emit('chat-message', { content });
    }, [emit]);

    const leaveRoom = useCallback(() => {
        dispatch({ type: 'RESET' });
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(STORAGE_PLAYER_ID);
            sessionStorage.removeItem(STORAGE_PLAYER_NAME);
            sessionStorage.removeItem(STORAGE_ROOM_CODE);
        }
        lastReconnectedSocketIdRef.current = null;
        reconnectInFlightRef.current = false;
    }, []);

    const value: GameContextValue = {
        state: {
            ...state,
            isMyTurn: state.currentTurnPlayerId === state.playerId,
        },
        createRoom,
        joinRoom,
        setRoomPassword,
        getGlobalLeaderboard,
        selectBox,
        setReady,
        startGame,
        openBox,
        openBoxes,
        respondToDeal,
        sendChatMessage,
        leaveRoom,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
