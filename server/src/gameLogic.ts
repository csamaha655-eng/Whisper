import { randomBytes } from 'crypto';
import type { GamePlayer } from './types.js';

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Assign roles (1 impostor, rest civilians)
export function assignRoles(players: GamePlayer[]): {
  players: GamePlayer[];
  impostorId: string;
} {
  // Create a shuffled array of indices to ensure better randomization
  const indices = Array.from({ length: players.length }, (_, i) => i);

  // Fisher-Yates shuffle for better randomness
  for (let i = indices.length - 1; i > 0; i--) {
    // Use crypto.randomBytes for better randomness in Node.js
    const randomBuffer = randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0) / (0xFFFFFFFF + 1);
    const j = Math.floor(randomValue * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Select the first shuffled index as the impostor
  const impostorIndex = indices[0];
  const impostorId = players[impostorIndex].id;

  const assignedPlayers = players.map((player, index) => ({
    ...player,
    role: index === impostorIndex ? 'impostor' as const : 'civilian' as const,
  }));

  return { players: assignedPlayers, impostorId };
}

// Generate randomized turn order
export function generateTurnOrder(players: GamePlayer[]): string[] {
  const ids = players.map(p => p.id);
  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

// Select a word and category for the game
export function selectWordForGame(): { word: string; category: string } {
  const wordDatabase = [
    {
      name: 'Animals',
      words: [
        'elephant', 'dolphin', 'penguin', 'kangaroo', 'octopus',
        'giraffe', 'crocodile', 'butterfly', 'flamingo', 'chameleon'
      ],
    },
    {
      name: 'Food',
      words: [
        'pizza', 'sushi', 'burger', 'taco', 'pasta',
        'chocolate', 'sandwich', 'pancake', 'popcorn', 'lasagna'
      ],
    },
    {
      name: 'Technology',
      words: [
        'smartphone', 'laptop', 'robot', 'satellite', 'drone',
        'keyboard', 'headphones', 'camera', 'microchip', 'hologram'
      ],
    },
    {
      name: 'Places',
      words: [
        'beach', 'mountain', 'desert', 'forest', 'island',
        'volcano', 'waterfall', 'canyon', 'glacier', 'jungle'
      ],
    },
    {
      name: 'Sports',
      words: [
        'basketball', 'tennis', 'swimming', 'skiing', 'boxing',
        'surfing', 'archery', 'hockey', 'gymnastics', 'wrestling'
      ],
    },
    {
      name: 'Jobs',
      words: [
        'doctor', 'firefighter', 'astronaut', 'detective', 'chef',
        'pilot', 'architect', 'scientist', 'photographer', 'mechanic'
      ],
    },
    {
      name: 'Music',
      words: [
        'guitar', 'piano', 'drums', 'violin', 'saxophone',
        'trumpet', 'concert', 'orchestra', 'karaoke', 'headphones'
      ],
    },
    {
      name: 'Movies',
      words: [
        'superhero', 'zombie', 'vampire', 'pirate', 'wizard',
        'dinosaur', 'alien', 'cowboy', 'samurai', 'gladiator'
      ],
    },
    {
      name: 'Objects',
      words: [
        'umbrella', 'telescope', 'microscope', 'compass', 'lantern',
        'hourglass', 'binoculars', 'kaleidoscope', 'pendulum', 'anchor'
      ],
    },
    {
      name: 'Nature',
      words: [
        'rainbow', 'lightning', 'tornado', 'earthquake', 'avalanche',
        'tsunami', 'eclipse', 'aurora', 'comet', 'meteor'
      ],
    },
  ];

  const category = wordDatabase[Math.floor(Math.random() * wordDatabase.length)];
  const word = category.words[Math.floor(Math.random() * category.words.length)];
  return { word, category: category.name };
}

