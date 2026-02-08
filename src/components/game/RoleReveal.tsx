import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { useGameStore } from '../../store/gameStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';

interface RoleRevealProps {
  onDismiss: () => void;
}

export function RoleReveal({ onDismiss }: RoleRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Check if multiplayer
  const multiplayerRoomCode = useMultiplayerStore((state) => state.roomCode);
  const multiplayerRole = useMultiplayerStore((state) => state.playerRole);
  const multiplayerSecretWord = useMultiplayerStore((state) => state.playerSecretWord);
  const multiplayerCategory = useMultiplayerStore((state) => state.playerCategory);

  // Single player
  const players = useGameStore((state) => state.players);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const secretWord = useGameStore((state) => state.secretWord);
  const category = useGameStore((state) => state.category);
  const settings = useGameStore((state) => state.settings);

  const humanPlayer = players.find((p) => p.id === humanPlayerId);

  const isMultiplayer = !!multiplayerRoomCode;
  const isImpostor = isMultiplayer
    ? multiplayerRole === 'impostor'
    : humanPlayer?.role === 'impostor';

  const displaySecretWord = isMultiplayer ? multiplayerSecretWord : secretWord;
  const displayCategory = isMultiplayer ? multiplayerCategory : category;
  const displayImpostorHint = isMultiplayer ? true : settings.impostorHintEnabled;

  useEffect(() => {
    // Delay reveal for dramatic effect
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-dark/80 backdrop-blur-sm">
      <GlassCard
        variant={isImpostor ? 'magenta' : 'cyan'}
        padding="lg"
        className={clsx(
          'max-w-md w-full text-center transform transition-all duration-500',
          isRevealed ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Role Badge */}
        <div
          className={clsx(
            'w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center',
            'border-4 transition-all duration-300',
            isImpostor
              ? 'border-neon-magenta bg-neon-magenta/10 shadow-[0_0_40px_rgba(255,0,255,0.5)]'
              : 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_40px_rgba(0,245,255,0.5)]'
          )}
        >
          <span className="text-4xl">{isImpostor ? '🔴' : '🟢'}</span>
        </div>

        {/* Role Title */}
        <h2
          className={clsx(
            'font-cyber text-3xl font-bold uppercase tracking-wider mb-4',
            isImpostor ? 'neon-text-magenta' : 'neon-text-cyan'
          )}
        >
          {isImpostor ? 'IMPOSTOR' : 'CIVILIAN'}
        </h2>

        {/* Role Description */}
        {isImpostor ? (
          <div className="space-y-4 mb-6">
            <p className="text-text-secondary">
              You do NOT know the secret word!
            </p>
            <p className="text-text-secondary text-sm">
              Listen to others' clues and blend in.
              <br />
              Give vague clues that could fit many words.
            </p>
            {displayImpostorHint && displayCategory && (
              <div className="p-3 bg-neon-magenta/10 rounded-lg border border-neon-magenta/30">
                <p className="text-xs text-text-muted uppercase mb-1">
                  Category Hint
                </p>
                <p className="text-neon-magenta font-cyber text-lg">{displayCategory}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-text-secondary">
              Your secret word is:
            </p>
            {displaySecretWord && (
              <div className="p-4 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
                <p className="text-neon-cyan font-cyber text-2xl font-bold uppercase tracking-wider">
                  {displaySecretWord}
                </p>
              </div>
            )}
            <p className="text-text-secondary text-sm">
              Give clues to prove you know the word,
              <br />
              but don't make it too obvious!
            </p>
          </div>
        )}

        {/* Category Display for Civilians */}
        {!isImpostor && displayCategory && (
          <p className="text-xs text-text-muted mb-6">
            Category: <span className="text-neon-cyan">{displayCategory}</span>
          </p>
        )}

        {/* Continue Button */}
        <NeonButton
          variant={isImpostor ? 'magenta' : 'cyan'}
          size="lg"
          onClick={onDismiss}
          fullWidth
        >
          Begin Mission
        </NeonButton>
      </GlassCard>
    </div>
  );
}
