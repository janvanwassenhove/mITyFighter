/**
 * @fileoverview Story Mode state management
 * @description Tracks progression through story mode fights
 */

import type { BackgroundId } from '../assets/backgroundRegistry';
import { BACKGROUND_IDS } from '../assets/backgroundRegistry';
import type { FighterId } from '../assets/fighterRegistry';
import { FIGHTER_IDS, FIGHTER_REGISTRY } from '../assets/fighterRegistry';
import type { AIDifficulty } from '../sim/FightingAI';

// =============================================================================
// Types
// =============================================================================

/** Story fight configuration */
export interface StoryFight {
  /** Opponent fighter ID */
  opponentId: FighterId;
  /** Stage for this fight */
  stageId: BackgroundId;
  /** AI difficulty for this opponent */
  difficulty: AIDifficulty;
  /** Pre-fight dialogue/story text */
  preFightText: string;
  /** Post-victory text */
  victoryText: string;
  /** Is this the final boss? */
  isBoss: boolean;
}

/** Story mode progress */
export interface StoryProgress {
  /** Player's chosen fighter */
  playerFighterId: FighterId;
  /** Selected difficulty level */
  difficulty: AIDifficulty;
  /** Current fight index (0-based) */
  currentFightIndex: number;
  /** Total wins */
  wins: number;
  /** Total losses (continues used) */
  losses: number;
  /** Is story complete? */
  isComplete: boolean;
  /** Continues remaining */
  continuesRemaining: number;
}

// =============================================================================
// Constants
// =============================================================================

/** Number of regular fights before the boss */
const REGULAR_FIGHTS = 5;

/** Maximum continues */
const MAX_CONTINUES = 3;

/** Preferred final boss fighter ID (may not exist if pack is missing) */
const PREFERRED_BOSS_ID: FighterId = 'elder_honkstorm';

/**
 * Resolve the actual boss fighter ID.
 * Falls back to a random available fighter, or the player's own fighter for mirror match.
 *
 * @param playerFighterId - The player's fighter
 * @returns A valid fighter ID to use as boss
 */
function resolveBossId(playerFighterId: FighterId): FighterId {
  if (FIGHTER_IDS.includes(PREFERRED_BOSS_ID) && PREFERRED_BOSS_ID !== playerFighterId) {
    return PREFERRED_BOSS_ID;
  }
  // Pick a different fighter if possible, otherwise mirror match
  const others = FIGHTER_IDS.filter(id => id !== playerFighterId);
  return others.length > 0 ? others[others.length - 1]! : playerFighterId;
}

/** Exported for backward compatibility */
export const FINAL_BOSS_ID: FighterId = PREFERRED_BOSS_ID;

// =============================================================================
// Story Generation
// =============================================================================

/**
 * Generate story fights based on player's chosen fighter.
 * Creates a sequence of increasingly difficult opponents culminating in the final boss.
 * 
 * @param playerFighterId - The player's selected fighter
 * @param difficultyOverride - Optional difficulty override. If provided, all non-boss fights use this difficulty,
 *                            and the boss uses nightmare. If not provided, uses difficulty progression.
 */
export function generateStoryFights(playerFighterId: FighterId, difficultyOverride?: AIDifficulty): StoryFight[] {
  const fights: StoryFight[] = [];
  const bossId = resolveBossId(playerFighterId);

  // Get available opponents (excluding player's fighter and the boss)
  let availableOpponents = FIGHTER_IDS.filter(
    id => id !== playerFighterId && id !== bossId
  );

  // If no other fighters are available, allow mirror matches (fight yourself)
  if (availableOpponents.length === 0) {
    availableOpponents = [playerFighterId];
  }
  
  // Shuffle and pick opponents, repeating if needed to fill REGULAR_FIGHTS slots
  const shuffled = [...availableOpponents].sort(() => Math.random() - 0.5);
  const selectedOpponents: FighterId[] = [];
  for (let i = 0; i < REGULAR_FIGHTS; i++) {
    selectedOpponents.push(shuffled[i % shuffled.length]!);
  }
  
  // Difficulty progression: if override provided, all fights use that difficulty (except boss)
  // If no override, use the default progression
  const getDifficulty = (index: number): AIDifficulty => {
    if (difficultyOverride) {
      return difficultyOverride;
    }
    const progression: AIDifficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard'];
    return progression[index] ?? 'medium';
  };

  // Safe stage resolver — always returns a valid stage ID
  const getStageId = (index: number): BackgroundId => {
    if (BACKGROUND_IDS.length === 0) return '' as BackgroundId;
    return BACKGROUND_IDS[index % BACKGROUND_IDS.length]!;
  };
  
  // Get player info for personalized text
  const player = FIGHTER_REGISTRY[playerFighterId];
  
  // Generate regular fights
  selectedOpponents.forEach((opponentId, index) => {
    const opponent = FIGHTER_REGISTRY[opponentId];
    
    fights.push({
      opponentId,
      stageId: getStageId(index),
      difficulty: getDifficulty(index),
      preFightText: generatePreFightText(player?.displayName ?? 'Fighter', opponent?.displayName ?? 'Opponent', index),
      victoryText: generateVictoryText(player?.displayName ?? 'Fighter', opponent?.displayName ?? 'Opponent', index),
      isBoss: false,
    });
  });
  
  // Add final boss fight
  const boss = FIGHTER_REGISTRY[bossId];
  
  fights.push({
    opponentId: bossId,
    stageId: getStageId(REGULAR_FIGHTS),
    difficulty: 'nightmare',
    preFightText: generateBossPreFightText(player?.displayName ?? 'Fighter', boss?.displayName ?? 'The Boss'),
    victoryText: generateBossVictoryText(player?.displayName ?? 'Fighter'),
    isBoss: true,
  });
  
  return fights;
}

/** Generate pre-fight dialogue */
function generatePreFightText(playerName: string, opponentName: string, fightIndex: number): string {
  const texts = [
    `${playerName} enters the arena. ${opponentName} stands ready, sizing up the challenger...`,
    `The crowd roars as ${playerName} faces ${opponentName}. This won't be easy...`,
    `${opponentName} sneers. "You've come far, ${playerName}, but your journey ends here!"`,
    `The tension is palpable. ${playerName} vs ${opponentName} - only one will advance!`,
    `${opponentName} cracks their knuckles. "I've been waiting for this, ${playerName}."`,
  ];
  return texts[fightIndex % texts.length] ?? texts[0] ?? '';
}

/** Generate victory dialogue */
function generateVictoryText(playerName: string, opponentName: string, fightIndex: number): string {
  const texts = [
    `${opponentName} falls! ${playerName} advances to the next round!`,
    `Victory! ${playerName} proves their worth against ${opponentName}!`,
    `${opponentName} is defeated. ${playerName}'s legend grows...`,
    `Another challenger vanquished! ${playerName} continues the climb!`,
    `${playerName} stands victorious over ${opponentName}. The finals await...`,
  ];
  return texts[fightIndex % texts.length] ?? texts[0] ?? '';
}

/** Generate boss pre-fight dialogue */
function generateBossPreFightText(playerName: string, bossName: string): string {
  return `The final battle approaches. ${bossName}, the tournament champion, awaits in the throne room.\n\n` +
    `"So, ${playerName}... you've defeated all my warriors. Impressive. But you face ME now!"\n\n` +
    `${playerName} steels their resolve. This is it - the ultimate challenge!`;
}

/** Generate boss victory dialogue */
function generateBossVictoryText(playerName: string): string {
  return `INCREDIBLE! ${playerName} has done the impossible!\n\n` +
    `The crowd erupts as the champion falls. A new legend is born!\n\n` +
    `🏆 CONGRATULATIONS! YOU ARE THE NEW CHAMPION! 🏆`;
}

// =============================================================================
// Story Progress Management
// =============================================================================

/** Create initial story progress */
export function createStoryProgress(playerFighterId: FighterId, difficulty: AIDifficulty = 'medium'): StoryProgress {
  return {
    playerFighterId,
    difficulty,
    currentFightIndex: 0,
    wins: 0,
    losses: 0,
    isComplete: false,
    continuesRemaining: MAX_CONTINUES,
  };
}

/** Advance to next fight after victory */
export function advanceStory(progress: StoryProgress, totalFights: number): StoryProgress {
  const nextIndex = progress.currentFightIndex + 1;
  const isComplete = nextIndex >= totalFights;
  
  return {
    ...progress,
    currentFightIndex: nextIndex,
    wins: progress.wins + 1,
    isComplete,
  };
}

/** Handle defeat - use continue or game over */
export function handleDefeat(progress: StoryProgress): { progress: StoryProgress; gameOver: boolean } {
  if (progress.continuesRemaining > 0) {
    return {
      progress: {
        ...progress,
        losses: progress.losses + 1,
        continuesRemaining: progress.continuesRemaining - 1,
      },
      gameOver: false,
    };
  }
  
  return {
    progress: {
      ...progress,
      losses: progress.losses + 1,
    },
    gameOver: true,
  };
}

/** Get current fight from story */
export function getCurrentFight(fights: StoryFight[], progress: StoryProgress): StoryFight | null {
  return fights[progress.currentFightIndex] ?? null;
}

/** Get total fight count */
export function getTotalFights(): number {
  return REGULAR_FIGHTS + 1; // Regular fights + boss
}
