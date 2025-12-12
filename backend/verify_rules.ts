
import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3001';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('🧪 Starting Verification Test (Full Round)...');

    const hostSocket = io(URL);
    const p2Socket = io(URL);

    let roomCode = '';
    let hostId = '';
    let p2Id = '';
    let boxesOpened = 0;

    try {
        // Connect
        await Promise.all([
            new Promise(res => hostSocket.on('connect', res)),
            new Promise(res => p2Socket.on('connect', res))
        ]);
        console.log('✅ Sockets connected');

        // Create & Join
        await new Promise<void>((resolve, reject) => {
            hostSocket.emit('create-room', { playerName: 'Host' }, (res: any) => {
                if (res.success) { roomCode = res.roomCode; hostId = res.playerId; resolve(); }
                else reject(res.error);
            });
        });
        console.log(`✅ Room Created: ${roomCode}`);

        await new Promise<void>((resolve, reject) => {
            p2Socket.emit('join-room', { roomCode, playerName: 'Player2' }, (res: any) => {
                if (res.success) { p2Id = res.playerId; resolve(); }
                else reject(res.error);
            });
        });
        console.log(`✅ Player 2 Joined`);

        // Select & Ready
        hostSocket.emit('select-box', { boxNumber: 1 });
        p2Socket.emit('select-box', { boxNumber: 20 });
        await wait(200);
        hostSocket.emit('player-ready');
        p2Socket.emit('player-ready');
        console.log('✅ Players Ready');
        await wait(200);

        // Start
        hostSocket.emit('start-game');

        // Game Loop
        await new Promise<void>((resolve, reject) => {
            const handleUpdate = async (state: any) => {
                if (state.phase === 'offer') {
                    console.log(`💰 Banker Offer Received: £${state.currentOffer}`);
                    console.log('✅ Round 1 Complete!');
                    hostSocket.off('game-state-update', handleUpdate);
                    resolve();
                    return;
                }

                if (state.phase === 'playing' && state.currentTurnPlayerId) {
                    // Check if it's our turn
                    const myId = state.currentTurnPlayerId;
                    const mySocket = myId === hostId ? hostSocket : p2Socket;

                    // Only act if we haven't acted for this precise turn state yet?
                    // Or just try to open a random box if it's our turn.

                    // Simple strategy: Always try to open box 2, 3, 4, 5, 6...
                    // Check likely available boxes
                    const allBoxes = state.boxes;
                    const available = allBoxes.find((b: any) => !b.isOpened && b.number !== 1 && b.number !== 20);

                    if (available) {
                        // Add a small delay to simulate human and avoid race conditions
                        await wait(100);
                        // Emit only if it is indeed our turn (double check)
                        mySocket.emit('open-box', { boxNumber: available.number });
                        // console.log(`👉 Player ${myId} opening box ${available.number}`);
                    }
                }
            };

            hostSocket.on('game-state-update', handleUpdate);
            // Also need P2 to listen? No, usually one listener is enough to see state, 
            // but we need both to trigger events?
            // Actually, handleUpdate logic selects the correct socket `mySocket` to emit.
            // But `hostSocket` receives updates. That's sufficient to trigger the logic.
        });

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        hostSocket.disconnect();
        p2Socket.disconnect();
        process.exit(0);
    }
}

runTest();
