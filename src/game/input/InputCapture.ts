/**
 * @fileoverview Input capture and recording for replay/rollback
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/INPUT.md - Input recording format
 * @see docs/NETPLAY_ROADMAP.md - Rollback requirements
 */

import type { InputFrame, InputRecord } from '../sim/InputFrame';
import { INPUT_FLAGS, createInputRecord } from '../sim/InputFrame';

// =============================================================================
// InputBuffer
// =============================================================================

/**
 * Ring buffer for input history.
 * Used for replay and rollback netcode.
 *
 * @example
 * ```typescript
 * const buffer = new InputBuffer(120); // 2 seconds at 60Hz
 *
 * // Store inputs each tick
 * buffer.push(tick, [p1Frame, p2Frame]);
 *
 * // Get inputs for rollback
 * const inputs = buffer.get(tick);
 * ```
 */
export class InputBuffer {
  /** Ring buffer storage */
  private buffer: (InputRecord | null)[];

  /** Buffer capacity */
  private capacity: number;

  /** Oldest tick in buffer */
  private oldestTick = 0;

  /** Newest tick in buffer */
  private newestTick = -1;

  /**
   * Create an input buffer.
   *
   * @param capacity - Maximum number of records to store
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  /**
   * Store input for a tick.
   *
   * @param tick - Simulation tick
   * @param inputs - Input frames [P1, P2]
   */
  public push(tick: number, inputs: [InputFrame, InputFrame]): void {
    const index = tick % this.capacity;

    this.buffer[index] = {
      tick,
      inputs: [...inputs],
    };

    if (this.newestTick < 0) {
      this.oldestTick = tick;
    }

    this.newestTick = tick;

    // Update oldest tick if we've wrapped around
    if (tick - this.oldestTick >= this.capacity) {
      this.oldestTick = tick - this.capacity + 1;
    }
  }

  /**
   * Get input record for a tick.
   *
   * @param tick - Simulation tick
   * @returns Input record or null if not found
   */
  public get(tick: number): InputRecord | null {
    if (tick < this.oldestTick || tick > this.newestTick) {
      return null;
    }

    const index = tick % this.capacity;
    const record = this.buffer[index];

    if (record && record.tick === tick) {
      return record;
    }

    return null;
  }

  /**
   * Get input frames for a tick.
   *
   * @param tick - Simulation tick
   * @returns Input frames or empty inputs if not found
   */
  public getInputs(tick: number): [InputFrame, InputFrame] {
    const record = this.get(tick);
    return record?.inputs ?? [INPUT_FLAGS.NONE, INPUT_FLAGS.NONE];
  }

  /**
   * Check if a tick is in the buffer.
   *
   * @param tick - Tick to check
   * @returns True if tick is available
   */
  public has(tick: number): boolean {
    return this.get(tick) !== null;
  }

  /**
   * Get the oldest tick in the buffer.
   */
  public getOldestTick(): number {
    return this.oldestTick;
  }

  /**
   * Get the newest tick in the buffer.
   */
  public getNewestTick(): number {
    return this.newestTick;
  }

  /**
   * Get buffer capacity.
   */
  public getCapacity(): number {
    return this.capacity;
  }

  /**
   * Get number of records stored.
   */
  public getSize(): number {
    if (this.newestTick < 0) return 0;
    return Math.min(this.newestTick - this.oldestTick + 1, this.capacity);
  }

  /**
   * Clear the buffer.
   */
  public clear(): void {
    this.buffer.fill(null);
    this.oldestTick = 0;
    this.newestTick = -1;
  }

  /**
   * Get all records in order (for replay).
   *
   * @returns Array of input records from oldest to newest
   */
  public getAll(): InputRecord[] {
    const records: InputRecord[] = [];

    for (let tick = this.oldestTick; tick <= this.newestTick; tick++) {
      const record = this.get(tick);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }
}

// =============================================================================
// InputRecorder
// =============================================================================

/**
 * Records and replays input sequences.
 *
 * @example
 * ```typescript
 * const recorder = new InputRecorder();
 *
 * // Record mode
 * recorder.startRecording();
 * // ... gameplay ...
 * recorder.record(tick, [p1, p2]);
 * const data = recorder.stopRecording();
 *
 * // Replay mode
 * recorder.startReplay(data);
 * const inputs = recorder.getReplayInputs(tick);
 * ```
 */
export class InputRecorder {
  /** Recording storage */
  private recording: InputRecord[] = [];

  /** Whether currently recording */
  private isRecording = false;

  /** Replay data */
  private replayData: InputRecord[] | null = null;

  /** Replay map for fast lookup */
  private replayMap: Map<number, InputRecord> = new Map();

  /**
   * Start recording inputs.
   */
  public startRecording(): void {
    this.recording = [];
    this.isRecording = true;
  }

  /**
   * Record input for a tick.
   *
   * @param tick - Simulation tick
   * @param inputs - Input frames [P1, P2]
   */
  public record(tick: number, inputs: [InputFrame, InputFrame]): void {
    if (!this.isRecording) return;

    this.recording.push({
      tick,
      inputs: [...inputs],
    });
  }

  /**
   * Stop recording and return data.
   *
   * @returns Recorded input sequence
   */
  public stopRecording(): InputRecord[] {
    this.isRecording = false;
    return [...this.recording];
  }

  /**
   * Check if currently recording.
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Start replay from recorded data.
   *
   * @param data - Input records to replay
   */
  public startReplay(data: InputRecord[]): void {
    this.replayData = data;
    this.replayMap.clear();

    for (const record of data) {
      this.replayMap.set(record.tick, record);
    }
  }

  /**
   * Get inputs for a tick during replay.
   *
   * @param tick - Tick to get inputs for
   * @returns Input frames or null if not in replay data
   */
  public getReplayInputs(tick: number): [InputFrame, InputFrame] | null {
    const record = this.replayMap.get(tick);
    return record?.inputs ?? null;
  }

  /**
   * Check if replaying.
   */
  public isReplaying(): boolean {
    return this.replayData !== null;
  }

  /**
   * Stop replay.
   */
  public stopReplay(): void {
    this.replayData = null;
    this.replayMap.clear();
  }

  /**
   * Get replay length in ticks.
   */
  public getReplayLength(): number {
    return this.replayData?.length ?? 0;
  }

  /**
   * Serialize recording to JSON string.
   *
   * @param data - Input records
   * @returns JSON string
   */
  public static serialize(data: InputRecord[]): string {
    return JSON.stringify(data);
  }

  /**
   * Deserialize recording from JSON string.
   *
   * @param json - JSON string
   * @returns Input records
   */
  public static deserialize(json: string): InputRecord[] {
    return JSON.parse(json) as InputRecord[];
  }
}

// Re-export for convenience
export { createInputRecord };
