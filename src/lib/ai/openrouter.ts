import OpenAI from 'openai';
import type { ClueGenerationParams, VoteGenerationParams } from '../../store/types';
import {
  getClueSystemPrompt,
  getVotingSystemPrompt,
  buildCivilianCluePrompt,
  buildImpostorCluePrompt,
  buildCivilianVotePrompt,
  buildImpostorVotePrompt,
  getTemperature,
} from './prompts';
import {
  getFallbackClue,
  getFallbackVote,
  validateAndCleanClue,
  parseVoteResponse,
} from './fallback';

// Initialize OpenAI client configured for OpenRouter
// Initialize OpenAI client configured for OpenRouter
// Use a dummy key if missing to prevent immediate crash on load
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || 'dummy-key-for-client-init';

if (apiKey === 'dummy-key-for-client-init') {
  console.warn('[OpenRouter] Missing VITE_OPENROUTER_API_KEY! AI features will fail.');
}

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
    'X-Title': 'Neon Whisper',
  },
});

// Model to use
const MODEL = 'google/gemini-2.0-flash-exp:free';

/**
 * Generate a clue from the AI
 */
export async function generateClue(params: ClueGenerationParams): Promise<string> {
  const {
    role,
    word,
    category,
    previousClues,
    playerClues,
    difficulty,
  } = params;

  // Build the appropriate prompt
  const prompt =
    role === 'civilian'
      ? buildCivilianCluePrompt({
        word: word!,
        previousClues,
        playerClues,
        difficulty,
      })
      : buildImpostorCluePrompt({
        category,
        previousClues,
        playerClues,
        difficulty,
      });

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getClueSystemPrompt(difficulty) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 20,
      temperature: getTemperature(difficulty),
    });

    const rawClue = response.choices[0]?.message?.content;
    const validClue = validateAndCleanClue(rawClue, word);

    if (validClue) {
      // Make sure it's not a repeat
      if (!previousClues.includes(validClue)) {
        return validClue;
      }
    }

    // Fallback if validation fails
    console.warn('AI clue validation failed, using fallback');
    return getFallbackClue({ role, word, category, previousClues });
  } catch (error) {
    console.error('AI clue generation error:', error);
    return getFallbackClue({ role, word, category, previousClues });
  }
}

/**
 * Generate a vote from the AI
 */
export async function generateVote(params: VoteGenerationParams): Promise<string> {
  const {
    role,
    word,
    allClues,
    playerNames,
    selfId,
    difficulty,
  } = params;

  // Build the appropriate prompt
  const prompt =
    role === 'civilian'
      ? buildCivilianVotePrompt({
        word: word!,
        allClues,
        playerNames,
        selfId,
      })
      : buildImpostorVotePrompt({
        allClues,
        playerNames,
        selfId,
      });

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getVotingSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      max_tokens: 50,
      temperature: getTemperature(difficulty) * 0.8, // Slightly lower for voting
    });

    const rawVote = response.choices[0]?.message?.content;
    const validNames = Object.values(playerNames).filter(
      (name) => playerNames[selfId] !== name
    );
    const validVote = parseVoteResponse(rawVote, validNames);

    if (validVote) {
      // Convert name back to ID
      const votedId = Object.entries(playerNames).find(
        ([, name]) => name === validVote
      )?.[0];
      if (votedId && votedId !== selfId) {
        return votedId;
      }
    }

    // Fallback if validation fails
    console.warn('AI vote validation failed, using fallback');
    return getFallbackVote({
      selfId,
      playerIds: Object.keys(playerNames),
    });
  } catch (error) {
    console.error('AI vote generation error:', error);
    return getFallbackVote({
      selfId,
      playerIds: Object.keys(playerNames),
    });
  }
}

/**
 * Check if the API is accessible
 */
export async function checkAPIConnection(): Promise<boolean> {
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });
    return !!response.choices[0]?.message?.content;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
}
