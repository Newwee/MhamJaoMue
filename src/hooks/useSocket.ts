import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameType, RoomSummary, BasePlayer } from '../types/common';
import { PokerGameState, PokerActionType } from '../types/poker';
import { BlackjackGameState, BlackjackActionType } from '../types/blackjack';
import { StoredProfile } from '../utils/playerStorage';
import { LocalGameController } from '../utils/localGameController';
import { fetchPublicRooms } from '../utils/roomRegistry';

export interface RoomState {
  id: string;
  name: string;
  gameType: GameType;
  maxPlayers: number;
  hostId: string;
  isSinglePlayer: boolean;
  players: BasePlayer[];
}

export function useSocket(profile: StoredProfile, onChipsUpdate: (chips: number) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [pokerState, setPokerState] = useState<PokerGameState | null>(null);
  const [blackjackState, setBlackjackState] = useState<BlackjackGameState | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localController = useMemo(() => {
    return new LocalGameController({
      onRoomState: (r) => setRoomState(r),
      onPokerState: (ps) => setPokerState(ps),
      onBlackjackState: (bs) => setBlackjackState(bs),
      onError: (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 4000);
      },
    });
  }, []);

  useEffect(() => {
    const isVercelHost =
      typeof window !== 'undefined' &&
      window.location.hostname.includes('vercel.app');

    const explicitServerUrl = (import.meta as any).env?.VITE_SERVER_URL;
    const isDev = typeof window !== 'undefined' && window.location.port === '5173';

    if (isVercelHost && !explicitServerUrl) {
      setIsConnected(true);
      return;
    }

    const serverUrl =
      explicitServerUrl ||
      (isDev ? `${window.location.protocol}//${window.location.hostname}:3001` : '/');

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 4000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMessage(null);
    });

    socket.on('connect_error', () => {
      if (isVercelHost) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });

    socket.on('disconnect', () => {
      if (!isVercelHost) {
        setIsConnected(false);
      }
    });

    socket.on('room_list', (data: RoomSummary[]) => {
      setRooms(data);
    });

    socket.on('room_joined', (data: { roomId: string; room: RoomState }) => {
      setRoomState(data.room);
      setErrorMessage(null);
    });

    socket.on('room_state', (data: RoomState) => {
      setRoomState(data);
    });

    socket.on('room_left', () => {
      setRoomState(null);
      setPokerState(null);
      setBlackjackState(null);
    });

    socket.on('poker_state', (data: PokerGameState) => {
      setPokerState(data);
    });

    socket.on('blackjack_state', (data: BlackjackGameState) => {
      setBlackjackState(data);
    });

    socket.on('chips_updated', (data: { chips: number }) => {
      onChipsUpdate(data.chips);
    });

    socket.on('error_message', (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [onChipsUpdate]);

  const createRoom = useCallback(
    (gameType: GameType, name?: string, maxPlayers?: number, isSinglePlayer = false) => {
      if (isSinglePlayer) {
        localController.startSinglePlayer(gameType, {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          chips: profile.chips,
        });
        return;
      }

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('create_room', {
          player: {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            chips: profile.chips,
          },
          gameType,
          name,
          maxPlayers,
          isSinglePlayer,
        });
      } else {
        localController.createP2PRoom(
          gameType,
          {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            chips: profile.chips,
          },
          name,
          maxPlayers
        );
      }
    },
    [profile, localController]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('join_room', {
          roomId,
          player: {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            chips: profile.chips,
          },
        });
      } else {
        localController.joinP2PRoom(roomId, {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          chips: profile.chips,
        });
      }
    },
    [profile, localController]
  );

  const leaveRoom = useCallback(() => {
    if (localController.isRunning()) {
      localController.cleanup();
      setRoomState(null);
      setPokerState(null);
      setBlackjackState(null);
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_room');
    }
  }, [localController]);

  const setReady = useCallback(
    (isReady: boolean) => {
      if (localController.isRunning()) {
        localController.setReady(isReady);
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('set_ready', { isReady });
      }
    },
    [localController]
  );

  const startGame = useCallback(() => {
    if (localController.isRunning()) {
      localController.startGame();
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start_game');
    }
  }, [localController]);

  const addBot = useCallback(() => {
    if (localController.isRunning()) {
      localController.addBot();
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('add_bot');
    }
  }, [localController]);

  const sendPokerAction = useCallback(
    (action: PokerActionType, amount?: number) => {
      if (localController.isRunning()) {
        localController.handlePokerAction(action, amount);
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('poker_action', { action, amount });
      }
    },
    [localController]
  );

  const sendBlackjackAction = useCallback(
    (action: BlackjackActionType) => {
      if (localController.isRunning()) {
        localController.handleBlackjackAction(action);
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('blackjack_action', { action });
      }
    },
    [localController]
  );

  const sendBlackjackBet = useCallback(
    (amount: number, pairBet = 0) => {
      if (localController.isRunning()) {
        localController.handleBlackjackBet(amount, pairBet);
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('blackjack_bet', { amount, pairBet });
      }
    },
    [localController]
  );

  const startNextHand = useCallback(() => {
    if (localController.isRunning()) {
      localController.startNextHand();
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start_next_hand');
    }
  }, [localController]);

  const refreshRooms = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('get_rooms');
    }
    fetchPublicRooms().then((publicRooms) => {
      if (publicRooms.length > 0) {
        setRooms((prev) => {
          const map = new Map<string, RoomSummary>();
          prev.forEach((r) => map.set(r.id, r));
          publicRooms.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
    });
  }, []);

  useEffect(() => {
    refreshRooms();
    const interval = setInterval(refreshRooms, 8000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  return {
    isConnected,
    roomState,
    pokerState,
    blackjackState,
    rooms,
    errorMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    addBot,
    sendPokerAction,
    sendBlackjackAction,
    sendBlackjackBet,
    startNextHand,
    refreshRooms,
  };
}
