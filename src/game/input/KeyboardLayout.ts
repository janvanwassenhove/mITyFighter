/**
 * @fileoverview Keyboard layout detection (QWERTY vs AZERTY)
 * @description Auto-detects keyboard layout and provides appropriate key mappings
 */

/* eslint-disable no-undef */
/* global navigator */

// =============================================================================
// Types
// =============================================================================

export type KeyboardLayout = 'qwerty' | 'azerty';

/**
 * Movement keys for a layout
 */
export interface MovementKeys {
  up: string;
  down: string;
  left: string;
  right: string;
}

// =============================================================================
// Layout Detection
// =============================================================================

/** Cached detected layout */
let detectedLayout: KeyboardLayout | null = null;

/**
 * Detect keyboard layout using navigator.keyboard API or language heuristics.
 * Falls back to QWERTY if detection fails.
 */
export async function detectKeyboardLayout(): Promise<KeyboardLayout> {
  if (detectedLayout) {
    return detectedLayout;
  }

  // Try using the Keyboard API (modern browsers)
  if ('keyboard' in navigator && 'getLayoutMap' in (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard!) {
    try {
      const keyboard = (navigator as Navigator & { keyboard: { getLayoutMap: () => Promise<Map<string, string>> } }).keyboard;
      const layoutMap = await keyboard.getLayoutMap();
      
      // Check if 'KeyQ' produces 'a' (AZERTY) or 'q' (QWERTY)
      const keyQ = layoutMap.get('KeyQ');
      if (keyQ === 'a' || keyQ === 'A') {
        detectedLayout = 'azerty';
        return detectedLayout;
      }
      
      // Check if 'KeyW' produces 'z' (AZERTY) or 'w' (QWERTY)
      const keyW = layoutMap.get('KeyW');
      if (keyW === 'z' || keyW === 'Z') {
        detectedLayout = 'azerty';
        return detectedLayout;
      }
    } catch {
      // API not available or failed, continue to fallback
    }
  }

  // Fallback: Use browser language to guess layout
  const lang = navigator.language?.toLowerCase() || '';
  if (lang.startsWith('fr') || lang.startsWith('be')) {
    // French and Belgian keyboards typically use AZERTY
    detectedLayout = 'azerty';
    return detectedLayout;
  }

  // Default to QWERTY
  detectedLayout = 'qwerty';
  return detectedLayout;
}

/**
 * Synchronous layout getter (returns cached value or defaults to QWERTY).
 * Call detectKeyboardLayout() first for accurate detection.
 */
export function getKeyboardLayout(): KeyboardLayout {
  return detectedLayout ?? 'qwerty';
}

/**
 * Manually set the keyboard layout (for user preference override).
 */
export function setKeyboardLayout(layout: KeyboardLayout): void {
  detectedLayout = layout;
}

// =============================================================================
// Key Mappings
// =============================================================================

/**
 * Get P1 movement key codes for the detected layout.
 * QWERTY: WASD
 * AZERTY: ZQSD
 */
export function getP1MovementKeys(layout: KeyboardLayout = getKeyboardLayout()): MovementKeys {
  if (layout === 'azerty') {
    return {
      up: 'KeyZ',
      down: 'KeyS',
      left: 'KeyQ',
      right: 'KeyD',
    };
  }
  // QWERTY
  return {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
  };
}

/**
 * Get display text for P1 movement keys.
 */
export function getP1MovementKeysDisplay(layout: KeyboardLayout = getKeyboardLayout()): string {
  return layout === 'azerty' ? 'ZQSD' : 'WASD';
}

/**
 * Get Phaser key codes for P1 movement.
 */
export function getP1PhaserKeyCodes(layout: KeyboardLayout = getKeyboardLayout()): {
  up: number;
  down: number;
  left: number;
  right: number;
} {
  // Phaser KeyCodes - same physical keys, different letters
  if (layout === 'azerty') {
    return {
      up: 90,    // Z
      down: 83,  // S
      left: 81,  // Q
      right: 68, // D
    };
  }
  // QWERTY
  return {
    up: 87,    // W
    down: 83,  // S
    left: 65,  // A
    right: 68, // D
  };
}
