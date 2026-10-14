import { test } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/roomManager';
import { setupSocketHandlers } from '../server/socketHandler';
import { PokerGameState } from '../src/types/poker';

test('Multiplayer Integration - Two Sessions Room Lifecycle, Hidden Card Privacy, and Turns', async () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const roomManager = new RoomManager();
  setupSocketHandlers(io, roomManager);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const serverUrl = `http://localhost:${port}`;

  const clientA: ClientSocketType = ClientSocket(serverUrl);
  const clientB: ClientSocketType = ClientSocket(serverUrl);

  await Promise.all([
    new Promise((resolve) => clientA.on('connect', resolve)),
    new Promise((resolve) => clientB.on('connect', resolve))
  ]);

  let roomId = '';
  const joinedPromiseA = new Promise<string>((resolve) => {
    clientA.on('room_joined', (data) => {
      roomId = data.roomId;
      resolve(data.roomId);
    });
  });

  clientA.emit('create_room', {
    player: { id: 'user_a', name: 'Alice', avatar: 'avatar-king', chips: 5000 },
    gameType: 'poker',
    name: 'Test Poker Table',
    maxPlayers: 6
  });

  await joinedPromiseA;
  assert.ok(roomId.length >= 4);

  const joinedPromiseB = new Promise<void>((resolve) => {
    clientB.on('room_joined', () => resolve());
  });

  clientB.emit('join_room', {
    roomId,
    player: { id: 'user_b', name: 'Bob', avatar: 'avatar-queen', chips: 5000 }
  });

  await joinedPromiseB;

  const statePromiseA = new Promise<PokerGameState>((resolve) => {
    clientA.on('poker_state', (st) => resolve(st));
  });

  const statePromiseB = new Promise<PokerGameState>((resolve) => {
    clientB.on('poker_state', (st) => resolve(st));
  });

  clientA.emit('start_game');

  const [stateA, stateB] = await Promise.all([statePromiseA, statePromiseB]);

  assert.strictEqual(stateA.phase, 'preflop');
  assert.strictEqual(stateB.phase, 'preflop');
  assert.strictEqual(stateA.players.length, 2);

  const aliceInA = stateA.players.find((p) => p.id === 'user_a')!;
  const bobInA = stateA.players.find((p) => p.id === 'user_b')!;
  assert.strictEqual(aliceInA.pocketCards.length, 2);
  assert.ok(!aliceInA.pocketCards[0].hidden);
  assert.ok(bobInA.pocketCards[0].hidden);

  const aliceInB = stateB.players.find((p) => p.id === 'user_a')!;
  const bobInB = stateB.players.find((p) => p.id === 'user_b')!;
  assert.strictEqual(bobInB.pocketCards.length, 2);
  assert.ok(!bobInB.pocketCards[0].hidden);
  assert.ok(aliceInB.pocketCards[0].hidden);

  const activeTurnId = stateA.turnPlayerId;
  assert.ok(activeTurnId === 'user_a' || activeTurnId === 'user_b');

  const wrongClient = activeTurnId === 'user_a' ? clientB : clientA;
  wrongClient.emit('poker_action', { action: 'check' });

  const rightClient = activeTurnId === 'user_a' ? clientA : clientB;
  const nextStatePromise = new Promise<PokerGameState>((resolve) => {
    rightClient.once('poker_state', (st) => resolve(st));
  });

  rightClient.emit('poker_action', { action: 'call' });
  const updatedState = await nextStatePromise;

  assert.ok(updatedState.actionLog.length > stateA.actionLog.length);

  clientA.disconnect();
  clientB.disconnect();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
