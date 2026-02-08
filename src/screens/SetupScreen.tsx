import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { NeonInput } from '../components/ui/NeonInput';
import { Toggle } from '../components/ui/Toggle';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { RoomLobby } from '../components/multiplayer/RoomLobby';
import { JoinRoom } from '../components/multiplayer/JoinRoom';
import type { Difficulty } from '../store/types';
import { clsx } from 'clsx';

type SetupMode = 'menu' | 'single' | 'multiplayer' | 'join' | 'lobby';

export function SetupScreen() {
  const [mode, setMode] = useState<SetupMode>('menu');
  const [playerName, setPlayerName] = useState('');
  const settings = useGameStore((state) => state.settings);
  const setPlayerNameStore = useGameStore((state) => state.setPlayerName);
  const setDifficulty = useGameStore((state) => state.setDifficulty);
  const toggleImpostorHint = useGameStore((state) => state.toggleImpostorHint);
  const startGame = useGameStore((state) => state.startGame);
  // Use selectors to prevent unnecessary re-renders
  const createRoom = useMultiplayerStore((state) => state.createRoom);
  const roomCode = useMultiplayerStore((state) => state.roomCode);

  // Fix: Use useEffect to avoid infinite loop
  useEffect(() => {
    if (roomCode && mode !== 'lobby') {
      setMode('lobby');
    }
  }, [roomCode, mode]);

  const difficulties: { value: Difficulty; label: string; description: string }[] = [
    { value: 'easy', label: 'EASY', description: 'Obvious clues, helpful hints' },
    { value: 'medium', label: 'MEDIUM', description: 'Balanced challenge' },
    { value: 'hard', label: 'HARD', description: 'Subtle clues, minimal help' },
  ];

  const handleSinglePlayerStart = () => {
    console.log('[SetupScreen] Starting single player game...');
    setPlayerNameStore(playerName || 'AGENT');
    startGame();
    console.log('[SetupScreen] Game started!');
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    createRoom(playerName.trim(), settings.difficulty, settings.impostorHintEnabled);
    // Don't call setMode here - useEffect will handle it when roomCode is set
  };

  // Show lobby
  if (mode === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <RoomLobby
          onStartGame={() => {
            // Game will be handled by multiplayer store
          }}
        />
      </div>
    );
  }

  // Show join room
  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <JoinRoom
          onJoined={() => setMode('lobby')}
          onBack={() => setMode('menu')}
        />
      </div>
    );
  }

  // Show single player setup
  if (mode === 'single') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard variant="cyan" padding="lg" className="max-w-lg w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.4)]">
              <span className="text-3xl">🔮</span>
            </div>
            <h1 className="font-cyber text-3xl font-bold tracking-wider mb-2">
              <span className="text-neon-cyan">NEON</span>
              <span className="text-text-primary"> WHISPER</span>
            </h1>
            <p className="text-text-secondary text-sm">
              Social Deduction • Word Game • Cyberpunk
            </p>
          </div>

          {/* Player Name Input */}
          <div className="mb-6">
            <NeonInput
              label="Agent Codename"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="block text-sm font-cyber font-medium text-neon-cyan uppercase tracking-wider mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value)}
                  className={clsx(
                    'p-3 rounded-lg border transition-all duration-300',
                    'font-cyber text-xs uppercase tracking-wider',
                    settings.difficulty === diff.value
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                      : 'bg-cyber-dark/40 border-cyber-light/30 text-text-secondary hover:border-neon-cyan/50'
                  )}
                >
                  {diff.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              {difficulties.find((d) => d.value === settings.difficulty)?.description}
            </p>
          </div>

          {/* Impostor Hint Toggle */}
          <div className="mb-8 p-4 bg-cyber-dark/40 rounded-lg border border-cyber-light/20">
            <Toggle
              checked={settings.impostorHintEnabled}
              onChange={toggleImpostorHint}
              label="Impostor Category Hint"
              description="When enabled, the Impostor receives a hint about the word category"
            />
          </div>

          {/* How to Play */}
          <div className="mb-8 p-4 bg-cyber-dark/40 rounded-lg border border-cyber-light/20">
            <h3 className="font-cyber text-sm text-neon-cyan uppercase tracking-wider mb-3">
              How to Play
            </h3>
            <ul className="text-xs text-text-secondary space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">1.</span>
                <span>One player is secretly the IMPOSTOR who doesn't know the word</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">2.</span>
                <span>Give one-word clues related to the secret word</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">3.</span>
                <span>After 2 rounds, vote to eliminate the Impostor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">4.</span>
                <span>Civilians win if they catch the Impostor!</span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="flex gap-3">
            <NeonButton variant="cyan" onClick={() => setMode('menu')}>
              Back
            </NeonButton>
            <NeonButton variant="cyan" size="lg" fullWidth onClick={handleSinglePlayerStart}>
              Initialize Game
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show multiplayer setup
  if (mode === 'multiplayer') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard variant="cyan" padding="lg" className="max-w-lg w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.4)]">
              <span className="text-3xl">👥</span>
            </div>
            <h1 className="font-cyber text-2xl font-bold tracking-wider mb-2">
              <span className="text-neon-cyan">CREATE</span>
              <span className="text-text-primary"> ROOM</span>
            </h1>
            <p className="text-text-secondary text-sm">
              Set up your game and invite friends
            </p>
          </div>

          {/* Player Name Input */}
          <div className="mb-6">
            <NeonInput
              label="Your Name"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="block text-sm font-cyber font-medium text-neon-cyan uppercase tracking-wider mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value)}
                  className={clsx(
                    'p-3 rounded-lg border transition-all duration-300',
                    'font-cyber text-xs uppercase tracking-wider',
                    settings.difficulty === diff.value
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                      : 'bg-cyber-dark/40 border-cyber-light/30 text-text-secondary hover:border-neon-cyan/50'
                  )}
                >
                  {diff.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              {difficulties.find((d) => d.value === settings.difficulty)?.description}
            </p>
          </div>

          {/* Impostor Hint Toggle */}
          <div className="mb-8 p-4 bg-cyber-dark/40 rounded-lg border border-cyber-light/20">
            <Toggle
              checked={settings.impostorHintEnabled}
              onChange={toggleImpostorHint}
              label="Impostor Category Hint"
              description="When enabled, the Impostor receives a hint about the word category"
            />
          </div>

          {/* Create Room Button */}
          <div className="flex gap-3">
            <NeonButton variant="cyan" onClick={() => setMode('menu')}>
              Back
            </NeonButton>
            <NeonButton variant="cyan" size="lg" fullWidth onClick={handleCreateRoom}>
              Create Room
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show main menu
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard variant="cyan" padding="lg" className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.4)]">
            <span className="text-3xl">🔮</span>
          </div>
          <h1 className="font-cyber text-3xl font-bold tracking-wider mb-2">
            <span className="text-neon-cyan">NEON</span>
            <span className="text-text-primary"> WHISPER</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Social Deduction • Word Game • Cyberpunk
          </p>
        </div>

        {/* Player Name Input */}
        <div className="mb-6">
          <NeonInput
            label="Agent Codename"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
          />
        </div>

        {/* Game Mode Selection */}
        <div className="mb-8">
          <label className="block text-sm font-cyber font-medium text-neon-cyan uppercase tracking-wider mb-3">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('single')}
              className="p-4 rounded-lg border border-neon-cyan/30 bg-cyber-dark/40 hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all duration-300"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-cyber text-sm uppercase tracking-wider text-text-primary">
                Single Player
              </div>
              <div className="text-xs text-text-muted mt-1">
                Play with AI bots
              </div>
            </button>
            <button
              onClick={() => setMode('multiplayer')}
              className="p-4 rounded-lg border border-neon-cyan/30 bg-cyber-dark/40 hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all duration-300"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-cyber text-sm uppercase tracking-wider text-text-primary">
                Multiplayer
              </div>
              <div className="text-xs text-text-muted mt-1">
                Play with friends
              </div>
            </button>
          </div>
        </div>

        {/* Join Room Button */}
        <div className="mb-6">
          <NeonButton
            variant="cyan"
            fullWidth
            onClick={() => setMode('join')}
          >
            Join Room
          </NeonButton>
        </div>

        {/* How to Play */}
        <div className="p-4 bg-cyber-dark/40 rounded-lg border border-cyber-light/20">
          <h3 className="font-cyber text-sm text-neon-cyan uppercase tracking-wider mb-3">
            How to Play
          </h3>
          <ul className="text-xs text-text-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">1.</span>
              <span>One player is secretly the IMPOSTOR who doesn't know the word</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">2.</span>
              <span>Give one-word clues related to the secret word</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">3.</span>
              <span>After 2 rounds, vote to eliminate the Impostor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan">4.</span>
              <span>Civilians win if they catch the Impostor!</span>
            </li>
          </ul>
        </div>
      </GlassCard>
    </div>
  );
}
