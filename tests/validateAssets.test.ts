/**
 * @fileoverview Tests for asset validation utilities
 */

import { describe, it, expect } from 'vitest';

import {
  validateSpriteDimensions,
  buildFighterAssetPath,
  buildBackgroundAssetPath,
  getExpectedFilename,
} from '../src/game/assets/validators/validateAssets';

describe('validateAssets', () => {
  describe('validateSpriteDimensions', () => {
    it('should validate correct dimensions', () => {
      // Single frame
      const single = validateSpriteDimensions(128, 128);
      expect(single.valid).toBe(true);
      expect(single.frameCount).toBe(1);

      // Multiple frames
      const multi = validateSpriteDimensions(640, 128);
      expect(multi.valid).toBe(true);
      expect(multi.frameCount).toBe(5);
    });

    it('should reject incorrect height', () => {
      const result = validateSpriteDimensions(128, 256);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Height');
    });

    it('should reject width not multiple of frame width', () => {
      const result = validateSpriteDimensions(200, 128);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('multiple');
    });

    it('should reject zero width', () => {
      const result = validateSpriteDimensions(0, 128);
      expect(result.valid).toBe(false);
    });
  });

  describe('buildFighterAssetPath', () => {
    it('should build correct path', () => {
      const path = buildFighterAssetPath('sprites/Kunoichi', 'Idle.png');
      expect(path).toBe('sprites/Kunoichi/Idle.png');
    });
  });

  describe('buildBackgroundAssetPath', () => {
    it('should build correct path', () => {
      const path = buildBackgroundAssetPath('dojo.png');
      expect(path).toBe('backgrounds/dojo.png');
    });
  });

  describe('getExpectedFilename', () => {
    it('should return correct filename for each action', () => {
      expect(getExpectedFilename('idle')).toBe('Idle.png');
      expect(getExpectedFilename('attack1')).toBe('Attack_1.png');
      expect(getExpectedFilename('special')).toBe('Special.png');
      expect(getExpectedFilename('win')).toBe('Win.png');
      expect(getExpectedFilename('intro')).toBe('Intro.png');
    });
  });
});
