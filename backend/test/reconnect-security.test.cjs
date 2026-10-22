const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const store = require('../dist/store/rooms');
const { registerSocketHandlers } = require('../dist/socket/handlers');

test('store requires independent proof, preserves identities and retires stale sockets', () => {
  const host = store.createRoom('old-host', 'Host');
  const guest = store.joinRoom(host.room.code, 'guest', 'Guest');
  assert.match(host.reconnectToken, /^[a-f0-9]{64}$/);
  assert.notEqual(host.reconnectToken, guest.reconnectToken);
  for (const proof of [undefined, '', {}, 'a', 'z'.repeat(64), '0'.repeat(64), guest.reconnectToken]) {
    assert.equal(store.reconnectPlayer(host.playerId, 'attacker', proof), undefined);
    assert.equal(store.getPlayerIdFromSocket('old-host'), host.playerId);
    assert.equal(store.getPlayerIdFromSocket('attacker'), undefined);
  }
  assert.equal(store.reconnectPlayer(host.playerId, 'guest', host.reconnectToken), undefined);
  assert.equal(store.getPlayerIdFromSocket('guest'), guest.playerId);
  for (const phase of ['waiting', 'playing', 'finished']) {
    host.room.gameState.phase = phase;
    const result = store.reconnectPlayer(host.playerId, 'new-' + phase, host.reconnectToken);
    assert.equal(result.room, host.room);
    assert.equal(store.getPlayerIdFromSocket(result.previousSocketId), undefined);
    assert.equal(store.handleDisconnect(result.previousSocketId), undefined);
    assert.equal(host.room.gameState.players.get(host.playerId).isConnected, true);
    assert.equal(host.room.gameState.players.get(host.playerId).isHost, true);
  }
  assert.equal(JSON.stringify([...host.room.gameState.players.values()]).includes(host.reconnectToken), false);
  host.room.gameState.finishedAt = 1;
  store.cleanupRooms(Date.now() + 10 ** 9);
  assert.equal(store.reconnectPlayer(host.playerId, 'expired', host.reconnectToken), undefined);
});

test('real sockets cannot become host using public IDs or another player proof', async (t) => {
  const server = http.createServer();
  const io = new Server(server);
  io.on('connection', socket => registerSocketHandlers(io, socket));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const sockets = [];
  t.after(async () => {
    sockets.forEach(socket => socket.disconnect());
    await new Promise(resolve => io.close(resolve));
  });
  const client = async () => {
    const socket = connect('http://127.0.0.1:' + server.address().port,
      { transports: ['websocket'], reconnection: false, forceNew: true });
    sockets.push(socket);
    await once(socket, 'connect');
    return socket;
  };
  const ack = (socket, event, payload) => new Promise((resolve, reject) => {
    socket.timeout(2000).emit(event, payload, (error, response) => error ? reject(error) : resolve(response));
  });
  const hostSocket = await client();
  const originalSocketId = hostSocket.id;
  const host = await ack(hostSocket, 'create-room', { playerName: 'Host' });
  const guestSocket = await client();
  const update = once(guestSocket, 'game-state-update');
  const guest = await ack(guestSocket, 'join-room', { roomCode: host.roomCode, playerName: 'Spectator', asSpectator: true });
  const [publicState] = await update;
  assert.ok(publicState.players.some(player => player.id === host.playerId && player.isHost));
  assert.equal(JSON.stringify(publicState).includes(host.reconnectToken), false);
  assert.equal(JSON.stringify(publicState).includes(guest.reconnectToken), false);
  for (const payload of [null, { playerId: host.playerId },
    { playerId: host.playerId, reconnectToken: guest.reconnectToken }]) {
    assert.equal((await ack(guestSocket, 'reconnect-player', payload)).success, false);
  }
  guestSocket.emit('reconnect-player', null); // Missing ack must not throw.
  assert.equal((await ack(guestSocket, 'set-room-password', { password: 'stolen' })).success, false);
  assert.equal(store.getRoom(host.roomCode).gameState.password, null);
  const replacement = await client();
  const disconnected = once(hostSocket, 'disconnect');
  const recovered = await ack(replacement, 'reconnect-player',
    { playerId: host.playerId, reconnectToken: host.reconnectToken });
  assert.equal(recovered.success, true);
  await disconnected;
  assert.equal(store.getPlayerIdFromSocket(originalSocketId), undefined);
  assert.equal((await ack(replacement, 'set-room-password', { password: 'legitimate' })).success, true);
  assert.equal(store.getRoom(host.roomCode).gameState.password, 'legitimate');
  assert.equal(store.getRoom(host.roomCode).gameState.players.get(host.playerId).isConnected, true);
});
