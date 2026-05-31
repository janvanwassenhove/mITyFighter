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
  getProfilePicKey,
  ACTION_IDS,
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
      expect(getFighterAnimationKey('ninja_monk', 'special')).toBe(
        'fighter:ninja_monk:special'
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
      expect(ACTION_IDS).toContain('attack2');
      expect(ACTION_IDS).toContain('special');
      expect(ACTION_IDS).toContain('jump');
      expect(ACTION_IDS).toContain('walk');
      expect(ACTION_IDS).toContain('run');
      expect(ACTION_IDS).toContain('crouch');
      expect(ACTION_IDS).toContain('block');
      expect(ACTION_IDS).toContain('hurt');
      expect(ACTION_IDS).toContain('dead');
      expect(ACTION_IDS).toContain('win');
      expect(ACTION_IDS).toContain('intro');
    });

    it('should have unique values', () => {
      const uniqueIds = new Set(ACTION_IDS);
      expect(uniqueIds.size).toBe(ACTION_IDS.length);
    });

    it('should have exactly 13 actions', () => {
      expect(ACTION_IDS.length).toBe(13);
    });
  });

  describe('getProfilePicKey', () => {
    it('should generate correct profile pic key', () => {
      expect(getProfilePicKey('ninja_jan', 'head-closeup')).toBe(
        'profile/ninja_jan/head-closeup'
      );
      expect(getProfilePicKey('ninja_jan', 'fighting-pose')).toBe(
        'profile/ninja_jan/fighting-pose'
      );
    });
  });
});
