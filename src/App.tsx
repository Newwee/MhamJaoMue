import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UwinNavbar } from './components/UwinNavbar';
import { UwinSidebar } from './components/UwinSidebar';
import { Lobby } from './components/Lobby';
import { RoomLobby } from './components/RoomLobby';
import { PokerTable } from './components/PokerTable';
import { BlackjackTable } from './components/BlackjackTable';
import { RulesModal } from './components/RulesModal';
import { StatsModal } from './components/StatsModal';
import { useSocket } from './hooks/useSocket';
import { getOrCreateProfile, saveProfile, StoredProfile, claimFaucetChips } from './utils/playerStorage';
import { GameType } from './types/common';
import { AlertCircle } from 'lucide-react';
import { sounds } from './audio/soundEffects';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<StoredProfile>(getOrCreateProfile);
  const [showRules, setShowRules] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('home');
  const hasJoinedUrlRoomRef = useRef(false);

  const handleChipsSync = useCallback((newChips: number) => {
    setProfile((prev) => {
      const updated = { ...prev, chips: newChips };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const {
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
  } = useSocket(profile, handleChipsSync);

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasJoinedUrlRoomRef.current) {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        hasJoinedUrlRoomRef.current = true;
        joinRoom(roomParam.toUpperCase());
      }
    }
  }, [joinRoom]);

  useEffect(() => {
    if (pokerState) {
      const me = pokerState.players.find((p) => p.id === profile.id);
      if (me && me.chips !== profile.chips) {
        handleChipsSync(me.chips);
      }
      if (pokerState.phase === 'ended' && pokerState.winners.length > 0) {
        const isWinner = pokerState.winners.some((w) => w.playerId === profile.id);
        const winAmount = pokerState.winners
          .filter((w) => w.playerId === profile.id)
          .reduce((sum, w) => sum + w.amount, 0);

        setProfile((prev) => {
          const updated = {
            ...prev,
            stats: {
              ...prev.stats,
              pokerHands: prev.stats.pokerHands + 1,
              pokerWins: isWinner ? prev.stats.pokerWins + 1 : prev.stats.pokerWins,
              pokerChipsWon: prev.stats.pokerChipsWon + winAmount,
            },
          };
          saveProfile(updated);
          return updated;
        });
      }
    }
  }, [pokerState, profile.id, profile.chips, handleChipsSync]);

  useEffect(() => {
    if (blackjackState) {
      const me = blackjackState.players.find((p) => p.id === profile.id);
      if (me && me.chips !== profile.chips) {
        handleChipsSync(me.chips);
      }
      if (blackjackState.phase === 'ended') {
        let handWins = 0;
        let bjCount = 0;
        let totalWon = 0;

        me?.hands.forEach((h) => {
          if (h.payoutResult === 'win' || h.payoutResult === 'blackjack') {
            handWins++;
            totalWon += h.payoutAmount || 0;
          }
          if (h.payoutResult === 'blackjack') {
            bjCount++;
          }
        });

        if (me && me.hands.length > 0) {
          setProfile((prev) => {
            const updated = {
              ...prev,
              stats: {
                ...prev.stats,
                bjHands: prev.stats.bjHands + me.hands.length,
                bjWins: prev.stats.bjWins + handWins,
                bjBlackjacks: prev.stats.bjBlackjacks + bjCount,
                bjChipsWon: prev.stats.bjChipsWon + totalWon,
              },
            };
            saveProfile(updated);
            return updated;
          });
        }
      }
    }
  }, [blackjackState, profile.id, profile.chips, handleChipsSync]);

  const handleStartSinglePlayer = (gameType: GameType) => {
    createRoom(gameType, undefined, undefined, true);
  };

  const handleClaimChips = () => {
    const updated = claimFaucetChips();
    sounds.playChipSound();
    handleChipsSync(updated);
  };

  const isCurrentHost = roomState ? roomState.hostId === profile.id : false;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
      <UwinNavbar
        chips={profile.chips}
        onChipsChange={handleChipsSync}
        onOpenRules={() => setShowRules(true)}
        onOpenStats={() => setShowStats(true)}
        onReturnHome={leaveRoom}
        isConnected={isConnected}
        playerName={profile.name}
      />

      {errorMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-red-950 border border-red-700 text-red-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex-1 flex w-full">
        {!roomState && (
          <UwinSidebar
            activeTab={activeSidebarTab}
            onSelectTab={(tab) => {
              setActiveSidebarTab(tab);
              if (tab === 'poker') handleStartSinglePlayer('poker');
              if (tab === 'blackjack') handleStartSinglePlayer('blackjack');
            }}
            onOpenWallet={handleClaimChips}
          />
        )}

        <main className="flex-1 flex flex-col items-center justify-start w-full overflow-x-hidden">
          {!roomState ? (
            <Lobby
              onStartSinglePlayer={handleStartSinglePlayer}
              onCreateRoom={(type, name, max) => createRoom(type, name, max, false)}
              onJoinRoom={joinRoom}
              rooms={rooms}
              onRefreshRooms={refreshRooms}
              onClaimChips={handleClaimChips}
            />
          ) : pokerState ? (
            <PokerTable
              state={pokerState}
              localPlayerId={profile.id}
              onAction={sendPokerAction}
              onNextHand={startNextHand}
              onLeave={leaveRoom}
              onAddBot={addBot}
              isHost={isCurrentHost}
            />
          ) : blackjackState ? (
            <BlackjackTable
              state={blackjackState}
              localPlayerId={profile.id}
              onAction={sendBlackjackAction}
              onPlaceBet={sendBlackjackBet}
              onNextHand={startNextHand}
              onLeave={leaveRoom}
              onAddBot={addBot}
              isHost={isCurrentHost}
            />
          ) : (
            <RoomLobby
              roomId={roomState.id}
              roomName={roomState.name}
              gameType={roomState.gameType}
              maxPlayers={roomState.maxPlayers}
              players={roomState.players}
              localPlayerId={profile.id}
              isHost={isCurrentHost}
              onStartGame={startGame}
              onToggleReady={setReady}
              onAddBot={addBot}
              onLeaveRoom={leaveRoom}
            />
          )}
        </main>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        onProfileUpdate={(up) => setProfile(up)}
      />
    </div>
  );
};
