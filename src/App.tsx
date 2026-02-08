import { useGameStore } from './store/gameStore';
import { useMultiplayerStore } from './store/multiplayerStore';
import { Background } from './components/layout/Background';
import { Header } from './components/layout/Header';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';

function App() {
  const phase = useGameStore((state) => state.phase);
  const multiplayerGameState = useMultiplayerStore((state) => state.gameState);
  const multiplayerRoomCode = useMultiplayerStore((state) => state.roomCode);

  const isMultiplayer = !!multiplayerRoomCode;
  const isGameActive = isMultiplayer
    ? !!multiplayerGameState && multiplayerGameState.phase !== 'setup'
    : phase !== 'setup';

  const isSetup = !isGameActive;

  console.log('[App] phase:', phase, 'isMultiplayer:', isMultiplayer, 'isGameActive:', isGameActive, 'isSetup:', isSetup);

  return (
    <div className="relative min-h-screen">
      {/* 3D Background - Always visible */}
      <Background />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Show when game is active */}
        {isGameActive && <Header />}

        {/* Screen Content */}
        <main className="flex-1">
          {isSetup ? <SetupScreen /> : <GameScreen />}
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-4 text-center">
          <p className="text-xs text-text-muted font-mono">
            NEON WHISPER v1.0 • Powered by AI
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
