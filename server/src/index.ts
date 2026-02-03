import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom, GameState, Player } from './types.js';
import { generateRoomCode, assignRoles, generateTurnOrder, selectWordForGame } from './gameLogic.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Neon Whisper Multiplayer Server is running!',
    timestamp: new Date().toISOString()
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Store active rooms
const rooms = new Map<string, GameRoom>();

// Clean up empty rooms every 5 minutes
setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create a new room
  socket.on('create-room', ({ playerName, difficulty, impostorHintEnabled }) => {
    const roomCode = generateRoomCode();
    const player: Player = {
      id: socket.id,
      name: playerName || 'Player',
      isHost: true,
      isReady: false,
    };

    const room: GameRoom = {
      code: roomCode,
      hostId: socket.id,
      players: [player],
      gameState: null,
      settings: {
        difficulty: difficulty || 'medium',
        impostorHintEnabled: impostorHintEnabled ?? true,
      },
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerId: socket.id });
    io.to(roomCode).emit('room-updated', { players: room.players });
  });

  // Join an existing room
  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.gameState !== null) {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    if (room.players.length >= 8) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName || 'Player',
      isHost: false,
      isReady: false,
    };

    room.players.push(player);
    socket.join(roomCode);
    socket.emit('room-joined', { roomCode, playerId: socket.id });
    io.to(roomCode).emit('room-updated', { players: room.players });
  });

  // Toggle ready status
  socket.on('toggle-ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(roomCode).emit('room-updated', { players: room.players });
    }
  });

  // Start game
  socket.on('start-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (socket.id !== room.hostId) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    if (room.players.length < 3) {
      socket.emit('error', { message: 'Need at least 3 players' });
      return;
    }

    if (!room.players.every((p) => p.isReady)) {
      socket.emit('error', { message: 'All players must be ready' });
      return;
    }

    // Initialize game
    const { word, category } = selectWordForGame();
    const gamePlayers = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isBot: false,
      role: 'civilian' as const,
      avatar: '👤',
      clues: [],
      votedFor: null,
    }));

    const { players: assignedPlayers, impostorId } = assignRoles(gamePlayers);
    const turnOrder = generateTurnOrder(assignedPlayers);

    const gameState: GameState = {
      phase: 'roleReveal',
      currentRound: 1,
      currentTurnIndex: 0,
      turnOrder,
      players: assignedPlayers,
      secretWord: word,
      category,
      impostorId,
      winner: null,
      voteCounts: {},
      showRoleReveal: true,
    };

    room.gameState = gameState;

    // Send game state to all players (but hide secret word and impostor role)
    io.to(roomCode).emit('game-started', {
      gameState: {
        ...gameState,
        secretWord: undefined, // Don't send secret word to clients
      },
      playerRoles: assignedPlayers.map((p) => ({
        id: p.id,
        role: p.role,
        secretWord: p.role === 'civilian' ? word : undefined,
        category: room.settings.impostorHintEnabled && p.role === 'impostor' ? category : undefined,
      })),
    });
  });

  // Submit clue
  socket.on('submit-clue', ({ roomCode, clue }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    const player = room.gameState.players.find((p) => p.id === socket.id);
    if (!player) return;

    const currentPlayerId = room.gameState.turnOrder[room.gameState.currentTurnIndex];
    if (currentPlayerId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    player.clues.push(clue.toLowerCase().trim());
    room.gameState.currentTurnIndex++;

    if (room.gameState.currentTurnIndex >= room.gameState.turnOrder.length) {
      // End of round
      if (room.gameState.currentRound === 1) {
        room.gameState.currentRound = 2;
        room.gameState.currentTurnIndex = 0;
        room.gameState.phase = 'round2';
      } else {
        room.gameState.phase = 'voting';
        room.gameState.currentTurnIndex = 0;
      }
    }

    io.to(roomCode).emit('game-state-updated', {
      gameState: {
        ...room.gameState,
        secretWord: undefined,
      },
    });
  });

  // Submit vote
  socket.on('submit-vote', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    if (room.gameState.phase !== 'voting') {
      socket.emit('error', { message: 'Not voting phase' });
      return;
    }

    const player = room.gameState.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.votedFor = targetId;

    // Check if all players have voted
    const allVoted = room.gameState.players.every((p) => p.votedFor !== null);
    if (allVoted) {
      // Calculate votes and determine winner
      const voteCounts: Record<string, number> = {};
      room.gameState.players.forEach((p) => {
        if (p.votedFor) {
          voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
        }
      });

      const maxVotes = Math.max(...Object.values(voteCounts));
      const playersWithMaxVotes = Object.entries(voteCounts)
        .filter(([, votes]) => votes === maxVotes)
        .map(([id]) => id);

      const eliminatedId =
        playersWithMaxVotes.length > 1
          ? playersWithMaxVotes[Math.floor(Math.random() * playersWithMaxVotes.length)]
          : playersWithMaxVotes[0];

      const winner = eliminatedId === room.gameState.impostorId ? 'civilians' : 'impostor';

      room.gameState.winner = winner;
      room.gameState.voteCounts = voteCounts;
      room.gameState.phase = 'result';

      io.to(roomCode).emit('game-state-updated', {
        gameState: {
          ...room.gameState,
          secretWord: undefined,
        },
      });
    } else {
      io.to(roomCode).emit('game-state-updated', {
        gameState: {
          ...room.gameState,
          secretWord: undefined,
        },
      });
    }
  });

  // Dismiss role reveal
  socket.on('dismiss-role-reveal', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    room.gameState.showRoleReveal = false;
    room.gameState.phase = 'round1';

    io.to(roomCode).emit('game-state-updated', {
      gameState: {
        ...room.gameState,
        secretWord: undefined,
      },
    });
  });

  // Get room state
  socket.on('get-room-state', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.emit('room-updated', { players: room.players });
    if (room.gameState) {
      socket.emit('game-state-updated', {
        gameState: {
          ...room.gameState,
          secretWord: undefined,
        },
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove player from room
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        // If host left, assign new host
        if (room.hostId === socket.id && room.players.length > 0) {
          room.hostId = room.players[0].id;
          room.players[0].isHost = true;
        }

        io.to(code).emit('room-updated', { players: room.players });

        // If game was in progress and players left, end game
        if (room.gameState !== null && room.players.length < 3) {
          room.gameState = null;
          io.to(code).emit('game-ended', { message: 'Not enough players' });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

