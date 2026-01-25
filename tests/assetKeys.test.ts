/**
 * @fileoverview Tests for asset key generation
 */

import { describe, it, expect } from 'vitest';

import {
  getFighterTextureKey,
  getFighterAnimationKey,
  parseFighterTextureKey,
  parseFighterAnimationKey,
  getBackgroundTextureKey,
  parseBackgroundTextureKey,
  ACTION_IDS,
  ACTION_TO_FILENAME,
  FILENAME_TO_ACTION,
} from '../src/game/assets/AssetKeys';

describe('AssetKeys', () => {
  describe('getFighterTextureKey', () => {
    it('should generate correct texture key', () => {
      expect(getFighterTextureKey('kunoichi', 'idle')).toBe(
        'fighter/kunoichi/idle'
      );
      expect(getFighterTextureKey('homeless_1', 'attack1')).toBe(
        'fighter/homeless_1/attack1'
      );
    });
  });

  describe('getFighterAnimationKey', () => {
    it('should generate correct animation key', () => {
      expect(getFighterAnimationKey('kunoichi', 'idle')).toBe(
        'fighter:kunoichi:idle'
      );
      expect(getFighterAnimationKey('ninja_monk', 'blade')).toBe(
        'fighter:ninja_monk:blade'
      );
    });
  });

  describe('parseFighterTextureKey', () => {
    it('should parse valid texture keys', () => {
      const result = parseFighterTextureKey('fighter/kunoichi/idle');
      expect(result).toEqual({ fighterId: 'kunoichi', actionId: 'idle' });
    });

    it('should return null for invalid keys', () => {
      expect(parseFighterTextureKey('invalid')).toBeNull();
      expect(parseFighterTextureKey('fighter/kunoichi')).toBeNull();
      expect(parseFighterTextureKey('bg/dojo')).toBeNull();
      expect(parseFighterTextureKey('fighter/kunoichi/invalid_action')).toBeNull();
    });
  });

  describe('parseFighterAnimationKey', () => {
    it('should parse valid animation keys', () => {
      const result = parseFighterAnimationKey('fighter:kunoichi:attack1');
      expect(result).toEqual({ fighterId: 'kunoichi', actionId: 'attack1' });
    });

    it('should return null for invalid keys', () => {
      expect(parseFighterAnimationKey('invalid')).toBeNull();
      expect(parseFighterAnimationKey('fighter:kunoichi')).toBeNull();
    });
  });

  describe('getBackgroundTextureKey', () => {
    it('should generate correct background key', () => {
      expect(getBackgroundTextureKey('dojo')).toBe('bg/dojo');
      expect(getBackgroundTextureKey('forest')).toBe('bg/forest');
    });
  });

  describe('parseBackgroundTextureKey', () => {
    it('should parse valid background keys', () => {
      expect(parseBackgroundTextureKey('bg/dojo')).toBe('dojo');
    });

    it('should return null for invalid keys', () => {
      expect(parseBackgroundTextureKey('invalid')).toBeNull();
      expect(parseBackgroundTextureKey('fighter/kunoichi/idle')).toBeNull();
    });
  });

  describe('ACTION_IDS', () => {
    it('should contain all expected actions', () => {
      expect(ACTION_IDS).toContain('idle');
      expect(ACTION_IDS).toContain('attack1');
      expect(ACTION_IDS).toContain('special');
      expect(ACTION_IDS).toContain('jump');
    });

    it('should have unique values', () => {
      const uniqueIds = new Set(ACTION_IDS);
      expect(uniqueIds.size).toBe(ACTION_IDS.length);
    });
  });

  describe('ACTION_TO_FILENAME mapping', () => {
    it('should have mapping for all actions', () => {
      for (const actionId of ACTION_IDS) {
        expect(ACTION_TO_FILENAME[actionId]).toBeDefined();
        expect(ACTION_TO_FILENAME[actionId]).toMatch(/\.png$/);
      }
    });
  });

  describe('FILENAME_TO_ACTION mapping', () => {
    it('should be inverse of ACTION_TO_FILENAME', () => {
      for (const [action, filename] of Object.entries(ACTION_TO_FILENAME)) {
        expect(FILENAME_TO_ACTION[filename]).toBe(action);
      }
    });
  });
});
