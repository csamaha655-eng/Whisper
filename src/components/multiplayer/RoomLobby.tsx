import { useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface RoomLobbyProps {
  onStartGame?: () => void;
}

export function RoomLobby({ onStartGame: _onStartGame }: RoomLobbyProps) {
  const {
    roomCode,
    players,
    isHost,
    playerId,
    toggleReady,
    startGame,
    connect,
    isConnected,
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('[RoomLobby] Connecting... roomCode:', roomCode);
    connect();
  }, []);

  console.log('[RoomLobby] Render - roomCode:', roomCode, 'isConnected:', isConnected, 'players:', players.length);

  const currentPlayer = players.find((p) => p.id === playerId);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allReady = players.length >= 3 && players.every((p) => p.isReady);
  const canStart = isHost && allReady;

  return (
    <GlassCard variant="cyan" padding="lg" className="max-w-2xl w-full">
      <div className="text-center mb-6">
        <h2 className="font-cyber text-2xl font-bold tracking-wider mb-2">
          <span className="text-neon-cyan">ROOM</span>
          <span className="text-text-primary"> LOBBY</span>
        </h2>
      </div>

      {/* Room Code */}
      <div className="mb-6">
        <label className="block text-sm font-cyber font-medium text-neon-cyan uppercase tracking-wider mb-2">
          Room Code
        </label>
        <div className="flex gap-2">
          <div className="flex-1 p-4 bg-cyber-dark/60 border border-neon-cyan/30 rounded-lg font-mono text-2xl text-center tracking-widest min-h-[60px] flex items-center justify-center">
            {roomCode || (
              <span className="text-text-muted text-base">Loading...</span>
            )}
          </div>
          <NeonButton
            variant="cyan"
            onClick={handleCopyCode}
            className="px-4"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </NeonButton>
        </div>
        <button
          onClick={handleCopyLink}
          className="mt-2 text-xs text-neon-cyan hover:text-neon-cyan/80 underline"
        >
          Copy invite link
        </button>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <label className="block text-sm font-cyber font-medium text-neon-cyan uppercase tracking-wider mb-3">
          Players ({players.length}/8)
        </label>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-cyber-dark/40 border border-cyber-light/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{player.isHost ? '👑' : '👤'}</span>
                <span className="text-text-primary font-medium">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs text-neon-cyan uppercase">Host</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {player.isReady ? (
                  <span className="text-xs text-green-400 uppercase">Ready</span>
                ) : (
                  <span className="text-xs text-text-muted uppercase">Not Ready</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready Button */}
      <div className="mb-6">
        <NeonButton
          variant="cyan"
          fullWidth
          onClick={toggleReady}
        >
          {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
        </NeonButton>
      </div>

      {/* Start Game Button */}
      {isHost && (
        <div className="mb-4">
          <NeonButton
            variant="cyan"
            fullWidth
            size="lg"
            onClick={() => {
              startGame();
            }}
            disabled={!canStart}
          >
            {allReady ? 'Start Game' : `Waiting for players (${players.length}/3 minimum)`}
          </NeonButton>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
          Not connected to server. Please check your connection.
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-cyber-dark/40 rounded-lg border border-cyber-light/20">
        <p className="text-xs text-text-secondary text-center">
          {isHost
            ? 'Share the room code or link with your friends. All players must be ready to start.'
            : 'Click Ready when you\'re prepared to start the game.'}
        </p>
      </div>
    </GlassCard>
  );
}

