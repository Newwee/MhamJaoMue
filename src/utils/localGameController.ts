import { PokerEngine } from '../../server/poker/pokerEngine';
import { BlackjackEngine } from '../../server/blackjack/blackjackEngine';
import { decideBotAction } from '../../server/poker/pokerBot';
import { GameType, BasePlayer, RoomSummary } from '../types/common';
import { PokerGameState, PokerPlayer, PokerActionType } from '../types/poker';
import { BlackjackGameState, BlackjackPlayer, BlackjackActionType } from '../types/blackjack';
import { RoomState } from '../hooks/useSocket';
import { announceRoom } from './roomRegistry';
import { Peer, DataConnection } from 'peerjs';

export interface LocalGameCallbacks {
  onRoomState: (room: RoomState | null) => void;
  onPokerState: (state: PokerGameState | null) => void;
  onBlackjackState: (state: BlackjackGameState | null) => void;
  onError: (msg: string) => void;
}

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  },
};

export class LocalGameController {
  private pokerEngine: PokerEngine | null = null;
  private blackjackEngine: BlackjackEngine | null = null;
  private roomState: RoomState | null = null;
  private botTimer: ReturnType<typeof setTimeout> | null = null;
  private announceTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: LocalGameCallbacks;
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private isP2PHost: boolean = false;
  private myPlayerId: string = '';

  constructor(callbacks: LocalGameCallbacks) {
    this.callbacks = callbacks;
  }

  public isRunning(): boolean {
    return Boolean(this.roomState);
  }

  public getRoomState(): RoomState | null {
    return this.roomState;
  }

  public startSinglePlayer(
    gameType: GameType,
    localPlayer: { id: string; name: string; avatar: string; chips: number }
  ): void {
    this.cleanup();
    this.myPlayerId = localPlayer.id;

    if (gameType === 'poker') {
      const botNames = ['CyberAce', 'Maverick', 'Viper'];
      const botAvatars = ['bot-1', 'bot-2', 'bot-3'];
      const players: PokerPlayer[] = [
        {
          id: localPlayer.id,
          name: localPlayer.name,
          avatar: localPlayer.avatar,
          chips: localPlayer.chips,
          isHost: true,
          isReady: true,
          isBot: false,
          isConnected: true,
          pocketCards: [],
          bet: 0,
          totalBetInHand: 0,
          folded: false,
          isAllIn: false,
          seatIndex: 0,
          hasActed: false,
        },
        ...botNames.map((bName, idx) => ({
          id: `bot-${idx + 1}`,
          name: bName,
          avatar: botAvatars[idx],
          chips: 5000,
          isHost: false,
          isReady: true,
          isBot: true,
          isConnected: true,
          pocketCards: [],
          bet: 0,
          totalBetInHand: 0,
          folded: false,
          isAllIn: false,
          seatIndex: idx + 1,
          hasActed: false,
        })),
      ];

      this.roomState = {
        id: 'SOLO-POKER',
        name: 'Texas Hold’em Solo Arena',
        gameType: 'poker',
        maxPlayers: 6,
        hostId: localPlayer.id,
        isSinglePlayer: true,
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips,
          isHost: p.isHost,
          isReady: p.isReady,
          isBot: p.isBot,
          isConnected: p.isConnected,
        })),
      };

      this.pokerEngine = new PokerEngine(players, 20, 40, (rawState) => {
        this.emitFilteredPokerState(rawState);
        this.checkLocalBotAction();
      });

      this.callbacks.onRoomState(this.roomState);
      this.pokerEngine.startHand();
    } else {
      const players: BlackjackPlayer[] = [
        {
          id: localPlayer.id,
          name: localPlayer.name,
          avatar: localPlayer.avatar,
          chips: localPlayer.chips,
          isHost: true,
          isReady: true,
          isBot: false,
          isConnected: true,
          hands: [],
          currentHandIndex: 0,
          currentBet: 100,
          hasPlacedBet: false,
          seatIndex: 0,
        },
      ];

      this.roomState = {
        id: 'SOLO-BJ',
        name: 'Blackjack Solo Arena',
        gameType: 'blackjack',
        maxPlayers: 1,
        hostId: localPlayer.id,
        isSinglePlayer: true,
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips,
          isHost: p.isHost,
          isReady: p.isReady,
          isBot: p.isBot,
          isConnected: p.isConnected,
        })),
      };

      this.blackjackEngine = new BlackjackEngine(players, 25, 1000, (state) => {
        this.callbacks.onBlackjackState(state);
      });

      this.callbacks.onRoomState(this.roomState);
      this.callbacks.onBlackjackState(this.blackjackEngine.getState());
    }
  }

  public createP2PRoom(
    gameType: GameType,
    hostPlayer: { id: string; name: string; avatar: string; chips: number },
    name?: string,
    maxPlayers?: number
  ): void {
    this.cleanup();
    this.isP2PHost = true;
    this.myPlayerId = hostPlayer.id;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const defaultMax = gameType === 'poker' ? 6 : 5;
    const roomName = name || `${hostPlayer.name}'s Table`;
    const capacity = maxPlayers || defaultMax;

    this.roomState = {
      id: code,
      name: roomName,
      gameType,
      maxPlayers: capacity,
      hostId: hostPlayer.id,
      isSinglePlayer: false,
      players: [
        {
          id: hostPlayer.id,
          name: hostPlayer.name,
          avatar: hostPlayer.avatar,
          chips: hostPlayer.chips,
          isHost: true,
          isReady: true,
          isBot: false,
          isConnected: true,
        },
      ],
    };

    this.callbacks.onRoomState(this.roomState);

    const roomSummary: RoomSummary = {
      id: code,
      name: roomName,
      gameType,
      playerCount: 1,
      maxPlayers: capacity,
      inGame: false,
      hostName: hostPlayer.name,
    };

    announceRoom(roomSummary);
    this.announceTimer = setInterval(() => {
      if (this.roomState) {
        announceRoom({
          ...roomSummary,
          playerCount: this.roomState.players.length,
          inGame: Boolean(this.pokerEngine || this.blackjackEngine),
        });
      }
    }, 25000);

    const peerId = `mham-casino-${code.toLowerCase()}`;
    const p = new Peer(peerId, PEER_CONFIG);
    this.peer = p;

    p.on('connection', (conn) => {
      conn.on('data', (raw: any) => {
        this.handlePeerMessage(conn, raw);
      });

      conn.on('close', () => {
        this.removePeer(conn);
      });
    });

    p.on('error', (err) => {
      this.callbacks.onError(`P2P Connection: ${err.message}`);
    });
  }

  public joinP2PRoom(
    roomCode: string,
    player: { id: string; name: string; avatar: string; chips: number }
  ): void {
    this.cleanup();
    this.isP2PHost = false;
    this.myPlayerId = player.id;

    const hostPeerId = `mham-casino-${roomCode.trim().toLowerCase()}`;
    const p = new Peer(PEER_CONFIG);
    this.peer = p;

    p.on('open', () => {
      const conn = p.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        conn.send({
          type: 'join',
          player: {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            chips: player.chips,
          },
        });
      });

      conn.on('data', (raw: any) => {
        this.handleGuestMessage(raw);
      });

      conn.on('close', () => {
        this.callbacks.onError('Disconnected from host.');
        this.cleanup();
      });
    });

    p.on('error', () => {
      this.callbacks.onError(`Could not join room ${roomCode}. Check room code.`);
    });
  }

  private handlePeerMessage(conn: DataConnection, msg: any): void {
    if (!this.isP2PHost || !this.roomState) return;

    switch (msg.type) {
      case 'join': {
        const guest = msg.player;
        if (this.roomState.players.length >= this.roomState.maxPlayers) {
          conn.send({ type: 'error', message: 'Room is full' });
          conn.close();
          return;
        }

        this.peerConnections.set(guest.id, conn);
        const existing = this.roomState.players.find((p) => p.id === guest.id);
        if (!existing) {
          this.roomState.players.push({
            id: guest.id,
            name: guest.name,
            avatar: guest.avatar,
            chips: guest.chips,
            isHost: false,
            isReady: false,
            isBot: false,
            isConnected: true,
          });
        }

        this.broadcastP2PRoomState();
        break;
      }

      case 'ready': {
        const pl = this.roomState.players.find((p) => p.id === msg.playerId);
        if (pl) pl.isReady = msg.isReady;
        this.broadcastP2PRoomState();
        break;
      }

      case 'poker_action': {
        if (this.pokerEngine) {
          this.pokerEngine.handleAction(msg.playerId, msg.action, msg.amount);
        }
        break;
      }

      case 'blackjack_action': {
        if (this.blackjackEngine) {
          this.blackjackEngine.handleAction(msg.playerId, msg.action);
        }
        break;
      }

      case 'blackjack_bet': {
        if (this.blackjackEngine) {
          this.blackjackEngine.placeBet(msg.playerId, msg.amount);
        }
        break;
      }

      case 'start_next_hand': {
        this.startNextHand();
        break;
      }

      default:
        break;
    }
  }

  private handleGuestMessage(msg: any): void {
    switch (msg.type) {
      case 'room_state':
        this.roomState = msg.room;
        this.callbacks.onRoomState(msg.room);
        break;
      case 'poker_state':
        this.callbacks.onPokerState(msg.state);
        break;
      case 'blackjack_state':
        this.callbacks.onBlackjackState(msg.state);
        break;
      case 'error':
        this.callbacks.onError(msg.message);
        break;
      default:
        break;
    }
  }

  private removePeer(conn: DataConnection): void {
    for (const [id, c] of this.peerConnections.entries()) {
      if (c === conn) {
        this.peerConnections.delete(id);
        if (this.roomState) {
          this.roomState.players = this.roomState.players.filter((p) => p.id !== id);
          this.broadcastP2PRoomState();
        }
        break;
      }
    }
  }

  private broadcastP2PRoomState(): void {
    if (!this.roomState) return;
    this.callbacks.onRoomState(this.roomState);
    for (const conn of this.peerConnections.values()) {
      conn.send({ type: 'room_state', room: this.roomState });
    }
  }

  public addBot(): void {
    if (!this.roomState) return;
    if (!this.isP2PHost && !this.roomState.isSinglePlayer) return;

    if (this.roomState.players.length >= this.roomState.maxPlayers) {
      this.roomState.maxPlayers += 1;
    }

    const botCount = this.roomState.players.filter((p) => p.isBot).length;
    const botNames = ['Titan', 'Nexus', 'Shadow', 'Phoenix', 'Oracle', 'Viper', 'Blaze'];
    const botName = botNames[botCount % botNames.length];
    const newBot: BasePlayer = {
      id: `bot-${Date.now()}-${botCount + 1}`,
      name: botName,
      avatar: `bot-${(botCount % 4) + 1}`,
      chips: 5000,
      isHost: false,
      isReady: true,
      isBot: true,
      isConnected: true,
    };
    this.roomState.players.push(newBot);

    if (this.pokerEngine) {
      const existingPlayers = this.pokerEngine.state.players;
      const existingMap = new Map(existingPlayers.map((pl) => [pl.id, pl]));

      const pokerPlayers: PokerPlayer[] = this.roomState.players.map((p, idx) => {
        const ex = existingMap.get(p.id);
        return {
          ...p,
          pocketCards: ex?.pocketCards || [],
          bet: ex?.bet || 0,
          totalBetInHand: ex?.totalBetInHand || 0,
          folded: ex?.folded ?? false,
          isAllIn: ex?.isAllIn ?? false,
          seatIndex: idx,
          hasActed: ex?.hasActed ?? false,
          handRankDescription: ex?.handRankDescription,
          wonAmount: ex?.wonAmount || 0,
        };
      });

      this.pokerEngine.setPlayers(pokerPlayers);
      this.emitFilteredPokerState(this.pokerEngine.getState());
      this.broadcastP2PPokerState(this.pokerEngine.getState());
      this.checkLocalBotAction();
    } else if (this.blackjackEngine) {
      const existingPlayers = this.blackjackEngine.state.players;
      const existingMap = new Map(existingPlayers.map((pl) => [pl.id, pl]));

      const bjPlayers: BlackjackPlayer[] = this.roomState.players.map((p, idx) => {
        const ex = existingMap.get(p.id);
        return {
          ...p,
          hands: ex?.hands || [],
          currentHandIndex: ex?.currentHandIndex || 0,
          currentBet: ex?.currentBet || 25,
          hasPlacedBet: ex?.hasPlacedBet || false,
          seatIndex: idx,
        };
      });

      this.blackjackEngine.setPlayers(bjPlayers);
      if (this.blackjackEngine.state.phase === 'betting') {
        this.blackjackEngine.autoBetBots();
      }
      this.callbacks.onBlackjackState(this.blackjackEngine.getState());
      for (const conn of this.peerConnections.values()) {
        conn.send({ type: 'blackjack_state', state: this.blackjackEngine.getState() });
      }
    }

    this.broadcastP2PRoomState();
  }

  public startGame(): void {
    if (!this.roomState || !this.isP2PHost) return;

    if (this.roomState.gameType === 'poker') {
      const pokerPlayers: PokerPlayer[] = this.roomState.players.map((p, idx) => ({
        ...p,
        pocketCards: [],
        bet: 0,
        totalBetInHand: 0,
        folded: false,
        isAllIn: false,
        seatIndex: idx,
        hasActed: false,
      }));

      this.pokerEngine = new PokerEngine(pokerPlayers, 20, 40, (state) => {
        this.emitFilteredPokerState(state);
        this.broadcastP2PPokerState(state);
        this.checkLocalBotAction();
      });

      this.pokerEngine.startHand();
    } else {
      const bjPlayers: BlackjackPlayer[] = this.roomState.players.map((p, idx) => ({
        ...p,
        hands: [],
        currentHandIndex: 0,
        currentBet: 25,
        hasPlacedBet: false,
        seatIndex: idx,
      }));

      this.blackjackEngine = new BlackjackEngine(bjPlayers, 25, 1000, (state) => {
        this.callbacks.onBlackjackState(state);
        for (const conn of this.peerConnections.values()) {
          conn.send({ type: 'blackjack_state', state });
        }
      });

      this.callbacks.onBlackjackState(this.blackjackEngine.getState());
      for (const conn of this.peerConnections.values()) {
        conn.send({ type: 'blackjack_state', state: this.blackjackEngine.getState() });
      }
      this.blackjackEngine.autoBetBots();
    }
  }

  private broadcastP2PPokerState(rawState: PokerGameState): void {
    for (const [pId, conn] of this.peerConnections.entries()) {
      const masked: PokerGameState = JSON.parse(JSON.stringify(rawState));
      const isShowdown = masked.phase === 'showdown' || masked.phase === 'ended';

      masked.players = masked.players.map((p) => {
        if (p.id === pId || isShowdown) return p;
        return {
          ...p,
          pocketCards: p.pocketCards.map(() => ({
            suit: 'spades' as const,
            rank: 'A' as const,
            hidden: true,
          })),
        };
      });

      conn.send({ type: 'poker_state', state: masked });
    }
  }

  public setReady(isReady: boolean): void {
    if (this.hostConnection) {
      this.hostConnection.send({
        type: 'ready',
        playerId: this.myPlayerId,
        isReady,
      });
    }
  }

  public handlePokerAction(action: PokerActionType, amount?: number): void {
    if (this.isP2PHost || this.roomState?.isSinglePlayer) {
      if (this.pokerEngine) {
        this.pokerEngine.handleAction(this.myPlayerId, action, amount);
      }
    } else if (this.hostConnection) {
      this.hostConnection.send({
        type: 'poker_action',
        playerId: this.myPlayerId,
        action,
        amount,
      });
    }
  }

  public handleBlackjackAction(action: BlackjackActionType): void {
    if (this.isP2PHost || this.roomState?.isSinglePlayer) {
      if (this.blackjackEngine) {
        this.blackjackEngine.handleAction(this.myPlayerId, action);
      }
    } else if (this.hostConnection) {
      this.hostConnection.send({
        type: 'blackjack_action',
        playerId: this.myPlayerId,
        action,
      });
    }
  }

  public handleBlackjackBet(amount: number): void {
    if (this.isP2PHost || this.roomState?.isSinglePlayer) {
      if (this.blackjackEngine) {
        this.blackjackEngine.placeBet(this.myPlayerId, amount);
      }
    } else if (this.hostConnection) {
      this.hostConnection.send({
        type: 'blackjack_bet',
        playerId: this.myPlayerId,
        amount,
      });
    }
  }

  public startNextHand(): void {
    if (this.isP2PHost || this.roomState?.isSinglePlayer) {
      if (this.pokerEngine) {
        this.pokerEngine.startHand();
      } else if (this.blackjackEngine) {
        this.blackjackEngine.resetForNextHand();
        this.callbacks.onBlackjackState(this.blackjackEngine.getState());
        for (const conn of this.peerConnections.values()) {
          conn.send({ type: 'blackjack_state', state: this.blackjackEngine.getState() });
        }
      }
    } else if (this.hostConnection) {
      this.hostConnection.send({
        type: 'start_next_hand',
        playerId: this.myPlayerId,
      });
    }
  }

  private checkLocalBotAction(): void {
    if (!this.pokerEngine) return;
    const state = this.pokerEngine.state;
    if (state.phase === 'ended' || state.phase === 'showdown' || !state.turnPlayerId) {
      if (state.phase === 'ended' && this.roomState?.isSinglePlayer) {
        setTimeout(() => {
          if (this.pokerEngine && this.pokerEngine.state.phase === 'ended') {
            this.pokerEngine.startHand();
          }
        }, 5000);
      }
      return;
    }

    const currentTurn = state.players.find((p) => p.id === state.turnPlayerId);
    if (!currentTurn || !currentTurn.isBot) return;

    if (this.botTimer) clearTimeout(this.botTimer);

    this.botTimer = setTimeout(() => {
      if (!this.pokerEngine) return;
      const curState = this.pokerEngine.state;
      const bot = curState.players.find((p) => p.id === curState.turnPlayerId && p.isBot);
      if (!bot) return;

      const decision = decideBotAction(
        bot,
        curState.currentBet,
        curState.minRaise,
        curState.communityCards,
        curState.bigBlind
      );

      this.pokerEngine.handleAction(bot.id, decision.action, decision.amount);
    }, 1200);
  }

  private emitFilteredPokerState(rawState: PokerGameState): void {
    const copy: PokerGameState = JSON.parse(JSON.stringify(rawState));
    const isShowdown = copy.phase === 'showdown' || copy.phase === 'ended';

    copy.players = copy.players.map((p) => {
      if (p.id === this.myPlayerId || isShowdown) {
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

    this.callbacks.onPokerState(copy);
  }

  public cleanup(): void {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.peerConnections.clear();
    this.hostConnection = null;
    this.pokerEngine = null;
    this.blackjackEngine = null;
    this.roomState = null;
    this.callbacks.onRoomState(null);
    this.callbacks.onPokerState(null);
    this.callbacks.onBlackjackState(null);
  }
}
