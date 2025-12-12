/**
 * Backend Server Entry Point
 * 
 * Express + Socket.io server for Deal or No Deal UK Multiplayer
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket/handlers';
import { cleanupRooms } from './store/rooms';

const PORT = process.env.PORT || 3001;

const app = express();

// When running behind a proxy (Render/Fly/Nginx), trust forwarded headers.
app.set('trust proxy', 1);

const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function wildcardToRegExp(pattern: string): RegExp {
    // Escape regex metacharacters except '*' which we treat as a wildcard.
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = `^${escaped.replace(/\*/g, '.*')}$`;
    return new RegExp(regex);
}

function parseCorsOrigins(raw: string | undefined): Array<string | RegExp> {
    if (!raw) return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((origin) => (origin.includes('*') ? wildcardToRegExp(origin) : origin));
}

const envOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
const allowedOrigins = envOrigins.length > 0 ? envOrigins : DEFAULT_CORS_ORIGINS;

// CORS configuration
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (req, res) => {
    const host = req.get('host') || `localhost:${PORT}`;
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || req.protocol || 'http';
    const wsProto = proto === 'https' ? 'wss' : 'ws';
    res.json({
        name: 'Deal or No Deal UK Multiplayer API',
        version: '1.0.0',
        websocket: `${wsProto}://${host}`,
    });
});

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Register socket handlers
io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎮 Deal or No Deal UK Multiplayer Server 🎮        ║
║                                                       ║
║   HTTP Server:    http://localhost:${PORT}              ║
║   WebSocket:      ws://localhost:${PORT}                ║
║                                                       ║
║   Ready for connections...                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

// Periodic cleanup of stale rooms (in-memory store)
const ROOM_CLEANUP_INTERVAL_MS = Number(process.env.ROOM_CLEANUP_INTERVAL_MS) || 10 * 60 * 1000; // 10 min
setInterval(() => {
    const result = cleanupRooms();
    if (result.removedRooms > 0) {
        console.log(`[Room] Cleaned up ${result.removedRooms} stale room(s)`);
    }
}, ROOM_CLEANUP_INTERVAL_MS).unref?.();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
