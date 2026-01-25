/**
 * @fileoverview Tests for InputFrame packing/unpacking
 */

import { describe, it, expect } from 'vitest';

import {
  INPUT_FLAGS,
  INPUT_ACTIONS,
  ACTION_TO_FLAG,
  packInputFrame,
  unpackInputFrame,
  hasFlag,
  setFlag,
  clearFlag,
  toggleFlag,
  getHorizontalDirection,
  getVerticalDirection,
  createInputRecord,
} from '../src/game/sim/InputFrame';

describe('InputFrame', () => {
  describe('INPUT_FLAGS', () => {
    it('should have unique bit values', () => {
      const values = Object.values(INPUT_FLAGS).filter((v) => v !== 0);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should be powers of 2', () => {
      for (const [key, value] of Object.entries(INPUT_FLAGS)) {
        if (key !== 'NONE') {
          expect(value).toBeGreaterThan(0);
          expect(value & (value - 1)).toBe(0); // Power of 2 check
        }
      }
    });
  });

  describe('ACTION_TO_FLAG', () => {
    it('should have mapping for all input actions', () => {
      for (const action of INPUT_ACTIONS) {
        expect(ACTION_TO_FLAG[action]).toBeDefined();
        expect(ACTION_TO_FLAG[action]).toBeGreaterThan(0);
      }
    });
  });

  describe('packInputFrame', () => {
    it('should pack empty actions to NONE', () => {
      expect(packInputFrame([])).toBe(INPUT_FLAGS.NONE);
    });

    it('should pack single action', () => {
      expect(packInputFrame(['left'])).toBe(INPUT_FLAGS.LEFT);
      expect(packInputFrame(['attack1'])).toBe(INPUT_FLAGS.ATTACK1);
    });

    it('should pack multiple actions', () => {
      const frame = packInputFrame(['left', 'attack1']);
      expect(frame).toBe(INPUT_FLAGS.LEFT | INPUT_FLAGS.ATTACK1);
    });

    it('should handle all actions', () => {
      const frame = packInputFrame([...INPUT_ACTIONS]);
      for (const action of INPUT_ACTIONS) {
        expect(hasFlag(frame, ACTION_TO_FLAG[action])).toBe(true);
      }
    });
  });

  describe('unpackInputFrame', () => {
    it('should unpack NONE to empty array', () => {
      expect(unpackInputFrame(INPUT_FLAGS.NONE)).toEqual([]);
    });

    it('should unpack single flag', () => {
      expect(unpackInputFrame(INPUT_FLAGS.LEFT)).toEqual(['left']);
      expect(unpackInputFrame(INPUT_FLAGS.ATTACK1)).toEqual(['attack1']);
    });

    it('should unpack multiple flags', () => {
      const frame = INPUT_FLAGS.LEFT | INPUT_FLAGS.UP | INPUT_FLAGS.ATTACK1;
      const actions = unpackInputFrame(frame);
      expect(actions).toContain('left');
      expect(actions).toContain('up');
      expect(actions).toContain('attack1');
      expect(actions.length).toBe(3);
    });

    it('should be inverse of packInputFrame', () => {
      const original = ['left', 'up', 'attack2'] as const;
      const packed = packInputFrame(original);
      const unpacked = unpackInputFrame(packed);
      expect(unpacked.sort()).toEqual([...original].sort());
    });
  });

  describe('hasFlag', () => {
    it('should detect single flag', () => {
      expect(hasFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.LEFT)).toBe(true);
      expect(hasFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.RIGHT)).toBe(false);
    });

    it('should detect flag in combined frame', () => {
      const frame = INPUT_FLAGS.LEFT | INPUT_FLAGS.ATTACK1;
      expect(hasFlag(frame, INPUT_FLAGS.LEFT)).toBe(true);
      expect(hasFlag(frame, INPUT_FLAGS.ATTACK1)).toBe(true);
      expect(hasFlag(frame, INPUT_FLAGS.RIGHT)).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('should set a flag', () => {
      const frame = setFlag(INPUT_FLAGS.NONE, INPUT_FLAGS.LEFT);
      expect(frame).toBe(INPUT_FLAGS.LEFT);
    });

    it('should not change already set flag', () => {
      const frame = setFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.LEFT);
      expect(frame).toBe(INPUT_FLAGS.LEFT);
    });

    it('should add flag to existing', () => {
      const frame = setFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.RIGHT);
      expect(frame).toBe(INPUT_FLAGS.LEFT | INPUT_FLAGS.RIGHT);
    });
  });

  describe('clearFlag', () => {
    it('should clear a flag', () => {
      const frame = clearFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.LEFT);
      expect(frame).toBe(INPUT_FLAGS.NONE);
    });

    it('should not affect unset flag', () => {
      const frame = clearFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.RIGHT);
      expect(frame).toBe(INPUT_FLAGS.LEFT);
    });

    it('should only clear specified flag', () => {
      const frame = clearFlag(
        INPUT_FLAGS.LEFT | INPUT_FLAGS.RIGHT,
        INPUT_FLAGS.LEFT
      );
      expect(frame).toBe(INPUT_FLAGS.RIGHT);
    });
  });

  describe('toggleFlag', () => {
    it('should set unset flag', () => {
      const frame = toggleFlag(INPUT_FLAGS.NONE, INPUT_FLAGS.LEFT);
      expect(frame).toBe(INPUT_FLAGS.LEFT);
    });

    it('should clear set flag', () => {
      const frame = toggleFlag(INPUT_FLAGS.LEFT, INPUT_FLAGS.LEFT);
      expect(frame).toBe(INPUT_FLAGS.NONE);
    });
  });

  describe('getHorizontalDirection', () => {
    it('should return -1 for left only', () => {
      expect(getHorizontalDirection(INPUT_FLAGS.LEFT)).toBe(-1);
    });

    it('should return 1 for right only', () => {
      expect(getHorizontalDirection(INPUT_FLAGS.RIGHT)).toBe(1);
    });

    it('should return 0 for neither', () => {
      expect(getHorizontalDirection(INPUT_FLAGS.NONE)).toBe(0);
      expect(getHorizontalDirection(INPUT_FLAGS.UP)).toBe(0);
    });

    it('should return 0 for both (cancel out)', () => {
      expect(
        getHorizontalDirection(INPUT_FLAGS.LEFT | INPUT_FLAGS.RIGHT)
      ).toBe(0);
    });
  });

  describe('getVerticalDirection', () => {
    it('should return -1 for up only', () => {
      expect(getVerticalDirection(INPUT_FLAGS.UP)).toBe(-1);
    });

    it('should return 1 for down only', () => {
      expect(getVerticalDirection(INPUT_FLAGS.DOWN)).toBe(1);
    });

    it('should return 0 for neither', () => {
      expect(getVerticalDirection(INPUT_FLAGS.NONE)).toBe(0);
    });

    it('should return 0 for both (cancel out)', () => {
      expect(getVerticalDirection(INPUT_FLAGS.UP | INPUT_FLAGS.DOWN)).toBe(0);
    });
  });

  describe('createInputRecord', () => {
    it('should create record with empty inputs', () => {
      const record = createInputRecord(42);
      expect(record.tick).toBe(42);
      expect(record.inputs).toEqual([INPUT_FLAGS.NONE, INPUT_FLAGS.NONE]);
    });
  });
});
