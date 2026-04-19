/**
 * @fileoverview Theme system for switchable visual styles
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see .github/skills/devoxx-theme/SKILL.md - Devoxx France 2026 palette
 */

/* eslint-disable no-undef */
/* global localStorage */

import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

/** Available theme identifiers */
export type ThemeId = 'classic' | 'devoxx_fr_2026';

/** All registered theme IDs */
export const THEME_IDS: readonly ThemeId[] = ['classic', 'devoxx_fr_2026'] as const;

/** Color palette for a theme */
export interface ThemeColors {
  /** Primary accent (titles, selected items) */
  readonly primary: string;
  /** Numeric primary for Phaser Graphics */
  readonly primaryHex: number;
  /** Secondary highlight (hover, accents) */
  readonly highlight: string;
  /** Numeric highlight for Phaser Graphics */
  readonly highlightHex: number;
  /** Default body text */
  readonly text: string;
  /** Muted / secondary text */
  readonly textMuted: string;
  /** Scene background */
  readonly background: string;
  /** Panel / card background */
  readonly panel: string;
  /** Numeric panel for Phaser Graphics */
  readonly panelHex: number;
  /** Tab / button active bg */
  readonly activePanel: string;
  /** Numeric active panel */
  readonly activePanelHex: number;
  /** Border / stroke for inactive elements */
  readonly border: string;
  /** Numeric border */
  readonly borderHex: number;
  /** Active border / stroke */
  readonly activeBorder: string;
  /** Numeric active border */
  readonly activeBorderHex: number;
  /** Success / positive state */
  readonly success: string;
  /** Numeric success */
  readonly successHex: number;
  /** Danger / negative state */
  readonly danger: string;
  /** Numeric danger */
  readonly dangerHex: number;
  /** Warning / caution state */
  readonly warning: string;
  /** Numeric warning */
  readonly warningHex: number;
}

/** Font families for a theme */
export interface ThemeFonts {
  /** Title / headline font */
  readonly title: string;
  /** Body text font */
  readonly body: string;
  /** Monospace / code font */
  readonly mono: string;
}

/** Complete theme definition */
export interface GameTheme {
  readonly id: ThemeId;
  readonly name: string;
  readonly colors: ThemeColors;
  readonly fonts: ThemeFonts;
}

// =============================================================================
// Theme Definitions
// =============================================================================

/** Classic MK-inspired red/gold theme */
const CLASSIC_THEME: GameTheme = {
  id: 'classic',
  name: 'Classic',
  colors: {
    primary: '#ffcc00',
    primaryHex: 0xffcc00,
    highlight: '#ff4444',
    highlightHex: 0xff4444,
    text: '#ffffff',
    textMuted: '#888888',
    background: '#0a0a15',
    panel: '#222244',
    panelHex: 0x222244,
    activePanel: '#334477',
    activePanelHex: 0x334477,
    border: '#444466',
    borderHex: 0x444466,
    activeBorder: '#ffcc00',
    activeBorderHex: 0xffcc00,
    success: '#66ff66',
    successHex: 0x66ff66,
    danger: '#ff6666',
    dangerHex: 0xff6666,
    warning: '#ffff00',
    warningHex: 0xffff00,
  },
  fonts: {
    title: 'Impact, sans-serif',
    body: 'Arial, sans-serif',
    mono: 'Courier New, monospace',
  },
};

/** Devoxx France 2026 conference branding theme */
const DEVOXX_FR_2026_THEME: GameTheme = {
  id: 'devoxx_fr_2026',
  name: 'Devoxx FR 2026',
  colors: {
    primary: '#E7B127',
    primaryHex: 0xe7b127,
    highlight: '#EA7E14',
    highlightHex: 0xea7e14,
    text: '#FFFFFF',
    textMuted: '#9BC1B8',
    background: '#0a0a15',
    panel: '#304936',
    panelHex: 0x304936,
    activePanel: '#3d5e44',
    activePanelHex: 0x3d5e44,
    border: '#609689',
    borderHex: 0x609689,
    activeBorder: '#E7B127',
    activeBorderHex: 0xe7b127,
    success: '#609689',
    successHex: 0x609689,
    danger: '#EA7E14',
    dangerHex: 0xea7e14,
    warning: '#E7B127',
    warningHex: 0xe7b127,
  },
  fonts: {
    title: 'Pirulen, Impact, sans-serif',
    body: 'Open Sans, Arial, sans-serif',
    mono: 'Courier New, monospace',
  },
};

// =============================================================================
// Theme Registry
// =============================================================================

/** Map of all themes by ID */
const THEMES: Record<ThemeId, GameTheme> = {
  classic: CLASSIC_THEME,
  devoxx_fr_2026: DEVOXX_FR_2026_THEME,
};

const STORAGE_KEY = 'devoxxFighterTheme';

/** Currently active theme ID (cached) */
let activeThemeId: ThemeId = 'classic';

// Initialize from localStorage on module load
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in THEMES) {
    activeThemeId = stored as ThemeId;
  }
} catch {
  // localStorage not available
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get the currently active theme.
 * @returns The active GameTheme definition
 */
export function getActiveTheme(): GameTheme {
  return THEMES[activeThemeId];
}

/**
 * Get the active theme ID.
 * @returns The current ThemeId
 */
export function getActiveThemeId(): ThemeId {
  return activeThemeId;
}

/**
 * Set the active theme and persist to localStorage.
 * @param id - Theme identifier to activate
 * @returns The newly activated GameTheme
 */
export function setActiveTheme(id: ThemeId): GameTheme {
  if (!(id in THEMES)) {
    logger.warn(`Unknown theme ID: ${id}, falling back to classic`);
    id = 'classic';
  }
  activeThemeId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage not available
  }
  return THEMES[id];
}

/**
 * Get a theme definition by ID.
 * @param id - Theme identifier
 * @returns The GameTheme or undefined if not found
 */
export function getTheme(id: ThemeId): GameTheme | undefined {
  return THEMES[id];
}

/**
 * Get display names for all available themes.
 * @returns Array of { id, name } for each theme
 */
export function getThemeList(): readonly { id: ThemeId; name: string }[] {
  return THEME_IDS.map((id) => ({ id, name: THEMES[id].name }));
}
