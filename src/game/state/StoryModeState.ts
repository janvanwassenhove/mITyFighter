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

/** Final boss fighter ID - the most powerful opponent */
export const FINAL_BOSS_ID: FighterId = 'elder_honkstorm';

// =============================================================================
// Story Generation
// =============================================================================

/**
 * Generate story fights based on player's chosen fighter.
 * Creates a sequence of increasingly difficult opponents culminating in the final boss.
 */
export function generateStoryFights(playerFighterId: FighterId): StoryFight[] {
  const fights: StoryFight[] = [];
  
  // Get available opponents (excluding player's fighter and final boss)
  const availableOpponents = FIGHTER_IDS.filter(
    id => id !== playerFighterId && id !== FINAL_BOSS_ID
  );
  
  // Shuffle and pick opponents
  const shuffled = [...availableOpponents].sort(() => Math.random() - 0.5);
  const selectedOpponents = shuffled.slice(0, REGULAR_FIGHTS);
  
  // Difficulty progression
  const difficulties: AIDifficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard'];
  
  // Get player info for personalized text
  const player = FIGHTER_REGISTRY[playerFighterId];
  
  // Generate regular fights
  selectedOpponents.forEach((opponentId, index) => {
    const opponent = FIGHTER_REGISTRY[opponentId];
    const stageIndex = index % BACKGROUND_IDS.length;
    const stageId = BACKGROUND_IDS[stageIndex] ?? 'pit';
    
    fights.push({
      opponentId,
      stageId,
      difficulty: difficulties[index] ?? 'medium',
      preFightText: generatePreFightText(player.displayName, opponent.displayName, index),
      victoryText: generateVictoryText(player.displayName, opponent.displayName, index),
      isBoss: false,
    });
  });
  
  // Add final boss fight
  const boss = FIGHTER_REGISTRY[FINAL_BOSS_ID];
  const bossStage: BackgroundId = 'throne';
  
  fights.push({
    opponentId: FINAL_BOSS_ID,
    stageId: BACKGROUND_IDS.includes(bossStage) ? bossStage : BACKGROUND_IDS[0] ?? 'pit',
    difficulty: 'nightmare',
    preFightText: generateBossPreFightText(player.displayName, boss?.displayName ?? 'The Boss'),
    victoryText: generateBossVictoryText(player.displayName),
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
export function createStoryProgress(playerFighterId: FighterId): StoryProgress {
  return {
    playerFighterId,
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
