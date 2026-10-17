import { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager';
import { GameType } from '../src/types/common';
import { PokerActionType } from '../src/types/poker';
import { BlackjackActionType } from '../src/types/blackjack';

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  roomManager.setCallbacks(
    (roomId: string, event: string, data: any) => {
      io.to(roomId).emit(event, data);
    },
    (socketId: string, event: string, data: any) => {
      io.to(socketId).emit(event, data);
    }
  );

  io.on('connection', (socket: Socket) => {
    socket.emit('room_list', roomManager.getRoomSummaryList());

    socket.on(
      'create_room',
      (payload: {
        player: { id: string; name: string; avatar: string; chips: number };
        gameType: GameType;
        name?: string;
        maxPlayers?: number;
        isSinglePlayer?: boolean;
      }) => {
        const room = roomManager.createRoom(
          { ...payload.player, socketId: socket.id },
          payload.gameType,
          payload.name,
          payload.maxPlayers,
          payload.isSinglePlayer
        );

        socket.join(room.id);
        socket.emit('room_joined', {
          roomId: room.id,
          room: {
            id: room.id,
            name: room.name,
            gameType: room.gameType,
            maxPlayers: room.maxPlayers,
            hostId: room.hostId,
            isSinglePlayer: room.isSinglePlayer,
            players: room.players,
          },
        });

        io.emit('room_list', roomManager.getRoomSummaryList());
      }
    );

    socket.on(
      'join_room',
      (payload: {
        roomId: string;
        player: { id: string; name: string; avatar: string; chips: number };
      }) => {
        const result = roomManager.joinRoom(payload.roomId, {
          ...payload.player,
          socketId: socket.id,
        });

        if (result.success && result.room) {
          socket.join(result.room.id);
          socket.emit('room_joined', {
            roomId: result.room.id,
            room: {
              id: result.room.id,
              name: result.room.name,
              gameType: result.room.gameType,
              maxPlayers: result.room.maxPlayers,
              hostId: result.room.hostId,
              isSinglePlayer: result.room.isSinglePlayer,
              players: result.room.players,
            },
          });
          io.emit('room_list', roomManager.getRoomSummaryList());
        } else {
          socket.emit('error_message', { message: result.error || 'Failed to join room' });
        }
      }
    );

    socket.on('leave_room', () => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        socket.leave(room.id);
        roomManager.leaveRoom(socket.id);
        socket.emit('room_left');
        io.emit('room_list', roomManager.getRoomSummaryList());
      }
    });

    socket.on('get_rooms', () => {
      socket.emit('room_list', roomManager.getRoomSummaryList());
    });

    socket.on('set_ready', (payload: { isReady: boolean }) => {
      roomManager.setReady(socket.id, payload.isReady);
    });

    socket.on('start_game', () => {
      const started = roomManager.startGame(socket.id);
      if (!started) {
        socket.emit('error_message', { message: 'Cannot start game. Need at least 2 players for Poker.' });
      } else {
        io.emit('room_list', roomManager.getRoomSummaryList());
      }
    });

    socket.on('add_bot', () => {
      roomManager.addBot(socket.id);
    });

    socket.on('poker_action', (payload: { action: PokerActionType; amount?: number }) => {
      roomManager.handlePokerAction(socket.id, payload.action, payload.amount);
    });

    socket.on('blackjack_action', (payload: { action: BlackjackActionType }) => {
      roomManager.handleBlackjackAction(socket.id, payload.action);
    });

    socket.on('blackjack_bet', (payload: { amount: number; pairBet?: number }) => {
      roomManager.handleBlackjackBet(socket.id, payload.amount, payload.pairBet || 0);
    });

    socket.on('start_next_hand', () => {
      roomManager.startNextHand(socket.id);
    });

    socket.on('claim_faucet', (payload: { playerId: string }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        const player = room.players.find((p) => p.id === payload.playerId);
        if (player) {
          player.chips += 5000;
          if (room.pokerEngine) {
            const pokerPl = room.pokerEngine.state.players.find((p) => p.id === payload.playerId);
            if (pokerPl) pokerPl.chips += 5000;
          }
          if (room.blackjackEngine) {
            const bjPl = room.blackjackEngine.state.players.find((p) => p.id === payload.playerId);
            if (bjPl) bjPl.chips += 5000;
          }
          socket.emit('chips_updated', { chips: player.chips });
        }
      }
    });

    socket.on('disconnect', () => {
      roomManager.handleDisconnect(socket.id);
      io.emit('room_list', roomManager.getRoomSummaryList());
    });
  });
}
