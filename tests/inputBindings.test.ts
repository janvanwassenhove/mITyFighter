/**
 * @fileoverview Tests for input bindings
 */

import { describe, it, expect } from 'vitest';

import {
  P1_BINDINGS,
  P2_BINDINGS_NUMPAD,
  P2_BINDINGS_NO_NUMPAD,
  GLOBAL_BINDINGS,
  getAllBindings,
  createBindingMap,
  isInputAction,
  isMetaAction,
  getPlayerBindings,
  getGlobalBindings,
} from '../src/game/input/InputBindings';
import { PlayerId } from '../src/game/config/constants';

describe('InputBindings', () => {
  describe('P1_BINDINGS', () => {
    it('should have movement bindings', () => {
      const actions = P1_BINDINGS.map((b) => b.action);
      expect(actions).toContain('left');
      expect(actions).toContain('right');
      expect(actions).toContain('up');
      expect(actions).toContain('down');
    });

    it('should have combat bindings', () => {
      const actions = P1_BINDINGS.map((b) => b.action);
      expect(actions).toContain('attack1');
      expect(actions).toContain('attack2');
      expect(actions).toContain('special');
      expect(actions).toContain('block');
    });

    it('should all belong to P1', () => {
      for (const binding of P1_BINDINGS) {
        expect(binding.player).toBe(PlayerId.P1);
      }
    });

    it('should use left side of keyboard (WASD area)', () => {
      const codes = P1_BINDINGS.map((b) => b.code);
      // Should not use arrow keys or numpad
      expect(codes).not.toContain('ArrowLeft');
      expect(codes).not.toContain('Numpad1');
    });
  });

  describe('P2_BINDINGS_NUMPAD', () => {
    it('should use arrow keys for movement', () => {
      const movementBindings = P2_BINDINGS_NUMPAD.filter((b) =>
        ['left', 'right', 'up', 'down'].includes(b.action as string)
      );
      const codes = movementBindings.map((b) => b.code);
      expect(codes).toContain('ArrowLeft');
      expect(codes).toContain('ArrowRight');
      expect(codes).toContain('ArrowUp');
      expect(codes).toContain('ArrowDown');
    });

    it('should use numpad for actions', () => {
      const codes = P2_BINDINGS_NUMPAD.map((b) => b.code);
      expect(codes).toContain('Numpad1');
      expect(codes).toContain('Numpad2');
      expect(codes).toContain('Numpad3');
      expect(codes).toContain('Numpad0');
    });

    it('should all belong to P2', () => {
      for (const binding of P2_BINDINGS_NUMPAD) {
        expect(binding.player).toBe(PlayerId.P2);
      }
    });
  });

  describe('P2_BINDINGS_NO_NUMPAD', () => {
    it('should use JKL area for movement', () => {
      const codes = P2_BINDINGS_NO_NUMPAD.map((b) => b.code);
      expect(codes).toContain('KeyJ');
      expect(codes).toContain('KeyL');
      expect(codes).toContain('KeyI');
      expect(codes).toContain('KeyK');
    });

    it('should not overlap with P1 bindings', () => {
      const p1Codes = new Set(P1_BINDINGS.map((b) => b.code));
      for (const binding of P2_BINDINGS_NO_NUMPAD) {
        expect(p1Codes.has(binding.code)).toBe(false);
      }
    });
  });

  describe('GLOBAL_BINDINGS', () => {
    it('should have debug toggle', () => {
      const actions = GLOBAL_BINDINGS.map((b) => b.action);
      expect(actions).toContain('toggleDebug');
    });

    it('should have background cycling', () => {
      const actions = GLOBAL_BINDINGS.map((b) => b.action);
      expect(actions).toContain('cycleBackgroundPrev');
      expect(actions).toContain('cycleBackgroundNext');
    });

    it('should have null player', () => {
      for (const binding of GLOBAL_BINDINGS) {
        expect(binding.player).toBeNull();
      }
    });
  });

  describe('getAllBindings', () => {
    it('should include P1, P2, and global bindings', () => {
      const withNumpad = getAllBindings(true);
      const withoutNumpad = getAllBindings(false);

      // Both should include P1 and global
      expect(withNumpad.length).toBeGreaterThan(P1_BINDINGS.length);
      expect(withoutNumpad.length).toBeGreaterThan(P1_BINDINGS.length);

      // Should differ in P2 bindings
      const numpadCodes = withNumpad.map((b) => b.code);
      const noNumpadCodes = withoutNumpad.map((b) => b.code);
      expect(numpadCodes).toContain('Numpad1');
      expect(noNumpadCodes).not.toContain('Numpad1');
    });
  });

  describe('createBindingMap', () => {
    it('should create map from code to binding', () => {
      const map = createBindingMap(P1_BINDINGS);
      expect(map.get('KeyA')?.action).toBe('left');
      expect(map.get('KeyD')?.action).toBe('right');
    });

    it('should handle all bindings', () => {
      const all = getAllBindings(true);
      const map = createBindingMap(all);
      expect(map.size).toBe(all.length);
    });
  });

  describe('isInputAction / isMetaAction', () => {
    it('should correctly identify input actions', () => {
      expect(isInputAction('left')).toBe(true);
      expect(isInputAction('attack1')).toBe(true);
      expect(isInputAction('toggleDebug')).toBe(false);
      expect(isInputAction('cycleCharacterNext')).toBe(false);
    });

    it('should correctly identify meta actions', () => {
      expect(isMetaAction('toggleDebug')).toBe(true);
      expect(isMetaAction('cycleCharacterNext')).toBe(true);
      expect(isMetaAction('left')).toBe(false);
      expect(isMetaAction('attack1')).toBe(false);
    });
  });

  describe('getPlayerBindings', () => {
    it('should filter bindings by player', () => {
      const all = getAllBindings(true);
      const p1 = getPlayerBindings(all, PlayerId.P1);
      const p2 = getPlayerBindings(all, PlayerId.P2);

      expect(p1.length).toBe(P1_BINDINGS.length);
      expect(p2.length).toBe(P2_BINDINGS_NUMPAD.length);

      for (const binding of p1) {
        expect(binding.player).toBe(PlayerId.P1);
      }
    });
  });

  describe('getGlobalBindings', () => {
    it('should return only global bindings', () => {
      const all = getAllBindings(true);
      const global = getGlobalBindings(all);

      expect(global.length).toBe(GLOBAL_BINDINGS.length);

      for (const binding of global) {
        expect(binding.player).toBeNull();
      }
    });
  });

  describe('No key overlap between players', () => {
    it('should have no overlapping keys between P1 and P2 (numpad mode)', () => {
      const p1Codes = new Set(P1_BINDINGS.map((b) => b.code));
      const p2Codes = new Set(P2_BINDINGS_NUMPAD.map((b) => b.code));

      for (const code of p1Codes) {
        expect(p2Codes.has(code)).toBe(false);
      }
    });

    it('should have no overlapping keys between P1 and P2 (no numpad mode)', () => {
      const p1Codes = new Set(P1_BINDINGS.map((b) => b.code));
      const p2Codes = new Set(P2_BINDINGS_NO_NUMPAD.map((b) => b.code));

      for (const code of p1Codes) {
        expect(p2Codes.has(code)).toBe(false);
      }
    });
  });
});
