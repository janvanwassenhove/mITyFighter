/**
 * @fileoverview Main entry point for DevoxxFighter
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */

import { GameApp } from './game/GameApp';

// Initialize the game
const game = new GameApp();
game.start();

// Export for debugging
if (import.meta.env.DEV) {
  (window as unknown as { game: GameApp }).game = game;
}
