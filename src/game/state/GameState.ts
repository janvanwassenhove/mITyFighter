/**
 * @fileoverview Game state types and constants
 * @description Defines the state machine for MK-style game flow
 */

import type { FighterId } from '../assets/fighterRegistry';
import type { BackgroundId } from '../assets/backgroundRegistry';

// =============================================================================
// Game Flow States
// =============================================================================

/** Main game states */
export enum GamePhase {
  /** Title/splash screen */
  TITLE = 'title',
  /** Character selection screen */
  CHARACTER_SELECT = 'character_select',
  /** Pre-fight "ROUND X" announcement */
  ROUND_START = 'round_start',
  /** Active fighting */
  FIGHTING = 'fighting',
  /** Post-round "X WINS" or KO */
  ROUND_END = 'round_end',
  /** Match complete - show winner */
  MATCH_END = 'match_end',
}

/** Fight states within a round */
export enum FightState {
  /** Countdown before fight starts */
  COUNTDOWN = 'countdown',
  /** "FIGHT!" announcement */
  FIGHT_ANNOUNCE = 'fight_announce',
  /** Active combat */
  ACTIVE = 'active',
  /** Someone's health hit zero */
  KO = 'ko',
  /** Time ran out */
  TIME_UP = 'time_up',
  /** Showing round result */
  RESULT = 'result',
}

// =============================================================================
// Player State
// =============================================================================

/** Single player's match state */
export interface PlayerMatchState {
  /** Selected fighter */
  fighterId: FighterId;
  /** Rounds won in current match */
  roundsWon: number;
  /** Current health (0-100) */
  health: number;
}

/** Both players' state */
export type PlayersMatchState = [PlayerMatchState, PlayerMatchState];

// =============================================================================
// Match Configuration
// =============================================================================

/** Match settings */
export interface MatchConfig {
  /** Rounds needed to win match */
  roundsToWin: number;
  /** Round time limit in seconds */
  roundTimeSeconds: number;
  /** Starting health for each player */
  startingHealth: number;
  /** Selected stage/background */
  stageId: BackgroundId;
}

/** Default match configuration */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  roundsToWin: 2,
  roundTimeSeconds: 99,
  startingHealth: 100,
  stageId: 'pit',
};

// =============================================================================
// Round State
// =============================================================================

/** Current round information */
export interface RoundState {
  /** Current round number (1-based) */
  roundNumber: number;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Current fight state */
  fightState: FightState;
  /** Winner of this round (null if ongoing) */
  roundWinner: 0 | 1 | null;
  /** Was it a draw (time up with equal health) */
  isDraw: boolean;
}

/** Create initial round state */
export function createInitialRoundState(config: MatchConfig): RoundState {
  return {
    roundNumber: 1,
    timeRemaining: config.roundTimeSeconds,
    fightState: FightState.COUNTDOWN,
    roundWinner: null,
    isDraw: false,
  };
}

// =============================================================================
// Full Game State
// =============================================================================

/** Complete game state */
export interface GameStateData {
  /** Current phase of the game */
  phase: GamePhase;
  /** Match configuration */
  matchConfig: MatchConfig;
  /** Both players' state */
  players: PlayersMatchState;
  /** Current round state */
  round: RoundState;
  /** Match winner (null if ongoing) */
  matchWinner: 0 | 1 | null;
}

/** Create initial game state */
export function createInitialGameState(): GameStateData {
  const config = { ...DEFAULT_MATCH_CONFIG };
  return {
    phase: GamePhase.TITLE,
    matchConfig: config,
    players: [
      { fighterId: 'sir_budgetalot', roundsWon: 0, health: config.startingHealth },
      { fighterId: 'count_cardboardius', roundsWon: 0, health: config.startingHealth },
    ],
    round: createInitialRoundState(config),
    matchWinner: null,
  };
}

/** Reset players for a new round */
export function resetPlayersForRound(
  players: PlayersMatchState,
  startingHealth: number
): void {
  players[0].health = startingHealth;
  players[1].health = startingHealth;
}

/** Reset for a new match */
export function resetForNewMatch(state: GameStateData): void {
  state.players[0].roundsWon = 0;
  state.players[1].roundsWon = 0;
  state.round = createInitialRoundState(state.matchConfig);
  state.matchWinner = null;
  resetPlayersForRound(state.players, state.matchConfig.startingHealth);
}
