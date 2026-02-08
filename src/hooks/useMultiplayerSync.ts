import { useEffect } from 'react';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useGameStore } from '../store/gameStore';

export function useMultiplayerSync() {
  const gameState = useMultiplayerStore((state) => state.gameState);
  const playerRole = useMultiplayerStore((state) => state.playerRole);
  const playerSecretWord = useMultiplayerStore((state) => state.playerSecretWord);
  const playerCategory = useMultiplayerStore((state) => state.playerCategory);
  const roomCode = useMultiplayerStore((state) => state.roomCode);

  useEffect(() => {
    if (gameState && roomCode) {
      useGameStore.setState((state) => {
        state.phase = gameState.phase;
        state.currentRound = gameState.currentRound;
        state.currentTurnIndex = gameState.currentTurnIndex;
        state.turnOrder = gameState.turnOrder;
        state.players = gameState.players;
        state.impostorId = gameState.impostorId;
        state.category = gameState.category;
        state.winner = gameState.winner;
        state.voteCounts = gameState.voteCounts;
        state.showRoleReveal = gameState.showRoleReveal;
        // Use player's secret word if they're a civilian
        if (playerSecretWord) {
          state.secretWord = playerSecretWord;
        }
      });
    }
  }, [gameState, roomCode, playerSecretWord]);

  return {
    isMultiplayer: !!roomCode,
    playerRole,
    playerSecretWord,
    playerCategory,
  };
}

