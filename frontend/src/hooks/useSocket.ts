/**
 * WebSocket hook for Socket.io connection
 * 
 * Provides connection management and typed event handling
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface UseSocketOptions {
    autoConnect?: boolean;
}

export interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    emit: <T = unknown, R = unknown>(event: string, data?: T, callback?: (response: R) => void) => void;
    on: <T = unknown>(event: string, handler: (data: T) => void) => () => void;
    off: (event: string) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const { autoConnect = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialise socket
    useEffect(() => {
        if (!autoConnect) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [autoConnect]);

    const connect = useCallback(() => {
        if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
        }
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }, []);

    const emit = useCallback(<T = unknown, R = unknown>(
        event: string,
        data?: T,
        callback?: (response: R) => void
    ) => {
        if (socketRef.current) {
            if (callback) {
                socketRef.current.emit(event, data, callback as (response: unknown) => void);
            } else {
                socketRef.current.emit(event, data);
            }
        }
    }, []) as <T = unknown, R = unknown>(event: string, data?: T, callback?: (response: R) => void) => void;

    const on = useCallback(<T = unknown>(
        event: string,
        handler: (data: T) => void
    ): (() => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler as (...args: unknown[]) => void);
            return () => {
                socketRef.current?.off(event, handler as (...args: unknown[]) => void);
            };
        }
        return () => { };
    }, []);

    const off = useCallback((event: string) => {
        if (socketRef.current) {
            socketRef.current.off(event);
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        connect,
        disconnect,
        emit,
        on,
        off,
    };
}
