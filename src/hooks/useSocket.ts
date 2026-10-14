import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameType, RoomSummary, BasePlayer } from '../types/common';
import { PokerGameState, PokerActionType } from '../types/poker';
import { BlackjackGameState, BlackjackActionType } from '../types/blackjack';
import { StoredProfile } from '../utils/playerStorage';

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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [pokerState, setPokerState] = useState<PokerGameState | null>(null);
  const [blackjackState, setBlackjackState] = useState<BlackjackGameState | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const isDev = window.location.port === '5173';
    const serverUrl =
      (import.meta as any).env?.VITE_SERVER_URL ||
      (isDev ? `${window.location.protocol}//${window.location.hostname}:3001` : '/');

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMessage(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
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
      if (!socketRef.current) return;
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
    },
    [profile]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit('join_room', {
        roomId,
        player: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          chips: profile.chips,
        },
      });
    },
    [profile]
  );

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_room');
  }, []);

  const setReady = useCallback((isReady: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit('set_ready', { isReady });
  }, []);

  const startGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_game');
  }, []);

  const addBot = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('add_bot');
  }, []);

  const sendPokerAction = useCallback((action: PokerActionType, amount?: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('poker_action', { action, amount });
  }, []);

  const sendBlackjackAction = useCallback((action: BlackjackActionType) => {
    if (!socketRef.current) return;
    socketRef.current.emit('blackjack_action', { action });
  }, []);

  const sendBlackjackBet = useCallback((amount: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('blackjack_bet', { amount });
  }, []);

  const startNextHand = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_next_hand');
  }, []);

  const refreshRooms = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('get_rooms');
  }, []);

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
