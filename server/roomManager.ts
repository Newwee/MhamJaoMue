import { GameType, RoomSummary, Card } from '../src/types/common';
import { PokerPlayer, PokerGameState, PokerActionType } from '../src/types/poker';
import { BlackjackPlayer, BlackjackGameState, BlackjackActionType } from '../src/types/blackjack';
import { PokerEngine } from './poker/pokerEngine';
import { BlackjackEngine } from './blackjack/blackjackEngine';
import { decideBotAction } from './poker/pokerBot';

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  isConnected: boolean;
}

export interface GameRoom {
  id: string;
  name: string;
  gameType: GameType;
  maxPlayers: number;
  hostId: string;
  isSinglePlayer: boolean;
  players: RoomPlayer[];
  pokerEngine?: PokerEngine;
  blackjackEngine?: BlackjackEngine;
  createdAt: number;
  botTurnTimer?: ReturnType<typeof setTimeout>;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, { roomId: string; playerId: string }> = new Map();
  private broadcastCallback?: (roomId: string, event: string, data: any) => void;
  private emitToSocketCallback?: (socketId: string, event: string, data: any) => void;

  constructor(
    broadcastCallback?: (roomId: string, event: string, data: any) => void,
    emitToSocketCallback?: (socketId: string, event: string, data: any) => void
  ) {
    this.broadcastCallback = broadcastCallback;
    this.emitToSocketCallback = emitToSocketCallback;
  }

  public setCallbacks(
    broadcast: (roomId: string, event: string, data: any) => void,
    emitToSocket: (socketId: string, event: string, data: any) => void
  ): void {
    this.broadcastCallback = broadcast;
    this.emitToSocketCallback = emitToSocket;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(
    host: { id: string; name: string; avatar: string; chips: number; socketId: string },
    gameType: GameType,
    name?: string,
    maxPlayers?: number,
    isSinglePlayer = false
  ): GameRoom {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const defaultMax = gameType === 'poker' ? 6 : 5;
    const room: GameRoom = {
      id: roomId,
      name: name || `${host.name}'s ${gameType === 'poker' ? 'Poker' : 'Blackjack'} Table`,
      gameType,
      maxPlayers: maxPlayers || defaultMax,
      hostId: host.id,
      isSinglePlayer,
      players: [
        {
          id: host.id,
          name: host.name,
          avatar: host.avatar,
          chips: host.chips,
          socketId: host.socketId,
          isHost: true,
          isReady: true,
          isBot: false,
          isConnected: true,
        },
      ],
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(host.socketId, { roomId, playerId: host.id });

    if (isSinglePlayer) {
      if (gameType === 'poker') {
        const botNames = ['CyberAce', 'Maverick', 'Viper'];
        const botAvatars = ['bot-1', 'bot-2', 'bot-3'];
        botNames.forEach((bName, idx) => {
          room.players.push({
            id: `bot-${idx + 1}`,
            name: bName,
            avatar: botAvatars[idx],
            chips: 5000,
            socketId: '',
            isHost: false,
            isReady: true,
            isBot: true,
            isConnected: true,
          });
        });
      }
      this.initGameEngine(room);
    }

    return room;
  }

  public joinRoom(
    roomId: string,
    player: { id: string; name: string; avatar: string; chips: number; socketId: string }
  ): { success: boolean; error?: string; room?: GameRoom } {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const existingPlayer = room.players.find((p) => p.id === player.id);
    if (existingPlayer) {
      existingPlayer.socketId = player.socketId;
      existingPlayer.isConnected = true;
      existingPlayer.name = player.name;
      existingPlayer.avatar = player.avatar;
      this.socketToRoom.set(player.socketId, { roomId: room.id, playerId: player.id });
      this.syncRoomState(room);
      return { success: true, room };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    const newPlayer: RoomPlayer = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      chips: player.chips,
      socketId: player.socketId,
      isHost: false,
      isReady: false,
      isBot: false,
      isConnected: true,
    };

    room.players.push(newPlayer);
    this.socketToRoom.set(player.socketId, { roomId: room.id, playerId: player.id });

    if (room.pokerEngine) {
      const pokerPlayers = this.mapToPokerPlayers(room.players);
      room.pokerEngine.setPlayers(pokerPlayers);
    } else if (room.blackjackEngine) {
      const bjPlayers = this.mapToBlackjackPlayers(room.players);
      room.blackjackEngine.setPlayers(bjPlayers);
    }

    this.syncRoomState(room);
    return { success: true, room };
  }

  public leaveRoom(socketId: string): void {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return;

    const { roomId, playerId } = mapping;
    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.filter((p) => !p.isBot).length === 0) {
      if (room.botTurnTimer) clearTimeout(room.botTurnTimer);
      this.rooms.delete(roomId);
      return;
    }

    if (room.hostId === playerId) {
      const nextHost = room.players.find((p) => !p.isBot);
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
      }
    }

    if (room.pokerEngine) {
      const pokerPlayers = this.mapToPokerPlayers(room.players);
      room.pokerEngine.setPlayers(pokerPlayers);
    } else if (room.blackjackEngine) {
      const bjPlayers = this.mapToBlackjackPlayers(room.players);
      room.blackjackEngine.setPlayers(bjPlayers);
    }

    this.syncRoomState(room);
  }

  public handleDisconnect(socketId: string): void {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return;

    const { roomId, playerId } = mapping;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }

    setTimeout(() => {
      const currentRoom = this.rooms.get(roomId);
      if (!currentRoom) return;
      const targetPlayer = currentRoom.players.find((p) => p.id === playerId);
      if (targetPlayer && !targetPlayer.isConnected) {
        this.leaveRoom(socketId);
      }
    }, 60000);

    this.syncRoomState(room);
  }

  public setReady(socketId: string, isReady: boolean): void {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return;
    const room = this.rooms.get(mapping.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === mapping.playerId);
    if (player) {
      player.isReady = isReady;
      this.syncRoomState(room);
    }
  }

  public addBot(socketId: string): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room || room.players.length >= room.maxPlayers) return false;

    const host = room.players.find((p) => p.id === mapping.playerId);
    if (!host || !host.isHost) return false;

    const botCount = room.players.filter((p) => p.isBot).length;
    const botId = `bot-${Date.now()}-${botCount + 1}`;
    const botNames = ['Titan', 'Nexus', 'Shadow', 'Phoenix', 'Oracle'];
    const botName = botNames[botCount % botNames.length];

    room.players.push({
      id: botId,
      name: botName,
      avatar: `bot-${(botCount % 4) + 1}`,
      chips: 5000,
      socketId: '',
      isHost: false,
      isReady: true,
      isBot: true,
      isConnected: true,
    });

    if (room.pokerEngine) {
      room.pokerEngine.setPlayers(this.mapToPokerPlayers(room.players));
    }

    this.syncRoomState(room);
    return true;
  }

  public startGame(socketId: string): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room) return false;

    const player = room.players.find((p) => p.id === mapping.playerId);
    if (!player || !player.isHost) return false;

    if (room.players.length < 2 && room.gameType === 'poker') return false;

    this.initGameEngine(room);
    return true;
  }

  private initGameEngine(room: GameRoom): void {
    if (room.gameType === 'poker') {
      const pokerPlayers = this.mapToPokerPlayers(room.players);
      room.pokerEngine = new PokerEngine(pokerPlayers, 20, 40, (state) => {
        this.broadcastFilteredPokerState(room, state);
        this.checkBotAction(room);
      });
      room.pokerEngine.startHand();
    } else {
      const bjPlayers = this.mapToBlackjackPlayers(room.players);
      room.blackjackEngine = new BlackjackEngine(bjPlayers, 25, 1000, (state) => {
        this.broadcastBlackjackState(room, state);
      });
      if (room.isSinglePlayer) {
        room.blackjackEngine.placeBet(room.players[0].id, 100);
      }
    }
    this.syncRoomState(room);
  }

  public handlePokerAction(socketId: string, action: PokerActionType, amount?: number): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room || !room.pokerEngine) return false;

    return room.pokerEngine.handleAction(mapping.playerId, action, amount);
  }

  public handleBlackjackAction(socketId: string, action: BlackjackActionType): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room || !room.blackjackEngine) return false;

    return room.blackjackEngine.handleAction(mapping.playerId, action);
  }

  public handleBlackjackBet(socketId: string, amount: number): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room || !room.blackjackEngine) return false;

    return room.blackjackEngine.placeBet(mapping.playerId, amount);
  }

  public startNextHand(socketId: string): boolean {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return false;
    const room = this.rooms.get(mapping.roomId);
    if (!room) return false;

    if (room.pokerEngine) {
      return room.pokerEngine.startHand();
    } else if (room.blackjackEngine) {
      room.blackjackEngine.state.phase = 'betting';
      for (const p of room.blackjackEngine.state.players) {
        p.hands = [];
        p.hasPlacedBet = false;
      }
      room.blackjackEngine.state.dealerCards = [];
      if (room.isSinglePlayer) {
        const lastBet = room.blackjackEngine.state.players[0]?.currentBet || 100;
        room.blackjackEngine.placeBet(room.players[0].id, lastBet);
      } else {
        this.broadcastBlackjackState(room, room.blackjackEngine.getState());
      }
      return true;
    }
    return false;
  }

  private checkBotAction(room: GameRoom): void {
    if (!room.pokerEngine) return;
    const state = room.pokerEngine.state;
    if (state.phase === 'ended' || state.phase === 'showdown' || !state.turnPlayerId) {
      if (state.phase === 'ended') {
        setTimeout(() => {
          if (room.pokerEngine && room.pokerEngine.state.phase === 'ended') {
            room.pokerEngine.startHand();
          }
        }, 6000);
      }
      return;
    }

    const currentTurnPlayer = state.players.find((p) => p.id === state.turnPlayerId);
    if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

    if (room.botTurnTimer) clearTimeout(room.botTurnTimer);

    room.botTurnTimer = setTimeout(() => {
      if (!room.pokerEngine) return;
      const curState = room.pokerEngine.state;
      const bot = curState.players.find((p) => p.id === curState.turnPlayerId && p.isBot);
      if (!bot) return;

      const botDecision = decideBotAction(
        bot,
        curState.currentBet,
        curState.minRaise,
        curState.communityCards,
        curState.bigBlind
      );

      room.pokerEngine.handleAction(bot.id, botDecision.action, botDecision.amount);
    }, 1200);
  }

  public getRoomSummaryList(): RoomSummary[] {
    const list: RoomSummary[] = [];
    for (const room of this.rooms.values()) {
      if (!room.isSinglePlayer) {
        const host = room.players.find((p) => p.isHost);
        list.push({
          id: room.id,
          name: room.name,
          gameType: room.gameType,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers,
          inGame: Boolean(room.pokerEngine || room.blackjackEngine),
          hostName: host ? host.name : 'Unknown',
        });
      }
    }
    return list;
  }

  public getRoomById(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getRoomBySocket(socketId: string): GameRoom | undefined {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return undefined;
    return this.rooms.get(mapping.roomId);
  }

  private broadcastFilteredPokerState(room: GameRoom, rawState: PokerGameState): void {
    if (!this.emitToSocketCallback) return;

    for (const player of room.players) {
      if (player.isBot || !player.socketId) continue;

      const stateCopy: PokerGameState = JSON.parse(JSON.stringify(rawState));
      const isShowdown = stateCopy.phase === 'showdown' || stateCopy.phase === 'ended';

      stateCopy.players = stateCopy.players.map((p) => {
        if (p.id === player.id || isShowdown) {
          return p;
        }
        return {
          ...p,
          pocketCards: p.pocketCards.map(() => ({
            suit: 'spades' as const,
            rank: 'A' as const,
            hidden: true,
          })),
        };
      });

      this.emitToSocketCallback(player.socketId, 'poker_state', stateCopy);
    }
  }

  private broadcastBlackjackState(room: GameRoom, rawState: BlackjackGameState): void {
    if (!this.broadcastCallback) return;
    this.broadcastCallback(room.id, 'blackjack_state', rawState);
  }

  private syncRoomState(room: GameRoom): void {
    if (!this.broadcastCallback) return;
    this.broadcastCallback(room.id, 'room_state', {
      id: room.id,
      name: room.name,
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      hostId: room.hostId,
      isSinglePlayer: room.isSinglePlayer,
      players: room.players,
    });
    if (room.pokerEngine) {
      this.broadcastFilteredPokerState(room, room.pokerEngine.getState());
    } else if (room.blackjackEngine) {
      this.broadcastBlackjackState(room, room.blackjackEngine.getState());
    }
  }

  private mapToPokerPlayers(players: RoomPlayer[]): PokerPlayer[] {
    return players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      isHost: p.isHost,
      isReady: p.isReady,
      isBot: p.isBot,
      isConnected: p.isConnected,
      pocketCards: [],
      bet: 0,
      totalBetInHand: 0,
      folded: false,
      isAllIn: false,
      seatIndex: idx,
      hasActed: false,
    }));
  }

  private mapToBlackjackPlayers(players: RoomPlayer[]): BlackjackPlayer[] {
    return players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      isHost: p.isHost,
      isReady: p.isReady,
      isBot: p.isBot,
      isConnected: p.isConnected,
      hands: [],
      currentHandIndex: 0,
      currentBet: 25,
      hasPlacedBet: false,
      seatIndex: idx,
    }));
  }
}
