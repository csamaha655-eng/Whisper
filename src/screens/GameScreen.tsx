import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useMultiplayerSync } from '../hooks/useMultiplayerSync';
import { GameBoard } from '../components/game/GameBoard';
import { RoleReveal } from '../components/game/RoleReveal';
import { ResultScreen } from '../components/game/ResultScreen';

export function GameScreen() {
  const phase = useGameStore((state) => state.phase);
  const showRoleReveal = useGameStore((state) => state.showRoleReveal);
  const dismissRoleReveal = useGameStore((state) => state.dismissRoleReveal);
  const resetGame = useGameStore((state) => state.resetGame);
  
  const { isMultiplayer } = useMultiplayerSync();
  const multiplayerDismissRoleReveal = useMultiplayerStore((state) => state.dismissRoleReveal);
  const multiplayerSubmitClue = useMultiplayerStore((state) => state.submitClue);
  const multiplayerSubmitVote = useMultiplayerStore((state) => state.submitVote);

  const { handleHumanClue, handleHumanVote } = useGameLoop();

  console.log('[GameScreen] Rendering - phase:', phase, 'showRoleReveal:', showRoleReveal, 'isMultiplayer:', isMultiplayer);

  const handlePlayAgain = () => {
    if (isMultiplayer) {
      // In multiplayer, reset goes back to lobby
      useMultiplayerStore.getState().reset();
    } else {
    resetGame();
    }
  };

  const handleDismissRoleReveal = () => {
    if (isMultiplayer) {
      multiplayerDismissRoleReveal();
    } else {
      dismissRoleReveal();
    }
  };

  const handleClue = (clue: string) => {
    if (isMultiplayer) {
      multiplayerSubmitClue(clue);
    } else {
      handleHumanClue(clue);
    }
  };

  const handleVote = (targetId: string) => {
    if (isMultiplayer) {
      multiplayerSubmitVote(targetId);
    } else {
      handleHumanVote(targetId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Role Reveal Modal - Show for roleReveal phase OR when showRoleReveal is true */}
      {(phase === 'roleReveal' || showRoleReveal) && <RoleReveal onDismiss={handleDismissRoleReveal} />}

      {/* Result Screen */}
      {phase === 'result' && <ResultScreen onPlayAgain={handlePlayAgain} />}

      {/* Main Game Board - Show for all game phases except roleReveal and result */}
      {(phase === 'round1' || phase === 'round2' || phase === 'voting') && (
        <div className="flex-1 py-4">
          <GameBoard onHumanClue={handleClue} onHumanVote={handleVote} />
        </div>
      )}

      {/* Fallback for setup phase - should not happen but prevents dark screen */}
      {phase === 'setup' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted font-cyber">Loading game...</p>
        </div>
      )}
    </div>
  );
}
