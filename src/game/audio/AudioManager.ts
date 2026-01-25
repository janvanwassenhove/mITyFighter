/**
 * @fileoverview Audio management for game sounds and announcer voice clips
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */

import type Phaser from 'phaser';

import { logger } from '../utils/logger';

// =============================================================================
// Audio Keys
// =============================================================================

/**
 * All available audio clip keys.
 * File names (without extension) are used as keys.
 */
export const AUDIO_KEYS = {
  // Countdown/numbers
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',

  // Mode announcements
  arcade_mode: 'arcade_mode',
  battle_mode: 'battle_mode',
  championship_mode: 'championship_mode',
  story_mode: 'story_mode',
  survival_mode: 'survival_mode',
  deathmatch: 'deathmatch',

  // Fight announcements
  begin: 'begin',
  fight: 'fight',
  ready: 'ready',
  prepare_yourself: 'prepare_yourself',
  choose_your_character: 'choose_your_character',

  // Round announcements
  round_1: 'round_1',
  round_2: 'round_2',
  round_3: 'round_3',
  round_4: 'round_4',
  round_5: 'round_5',
  final_round: 'final_round',

  // Combat announcements
  combo: 'combo',
  combo_breaker: 'combo_breaker',
  multi_kill: 'multi_kill',

  // End of round/match
  time: 'time',
  game_over: 'game_over',
  flawless_victory: 'flawless_victory',
  winner: 'winner',
  loser: 'loser',
  you_win: 'you_win',
  you_lose: 'you_lose',
  "it's_a_tie": "it's_a_tie",
  tie: 'tie',
  tie_breaker: 'tie_breaker',
  sudden_death: 'sudden_death',

  // Player announcements
  player_1: 'player_1',
  player_2: 'player_2',

  // Finish commands
  kill_her: 'kill_her',
  kill_him: 'kill_him',
  kill_it: 'kill_it',

  // Impact sounds (SFX)
  impact_1: 'impact_1',
  impact_2: 'impact_2',
  impact_3: 'impact_3',
  impact_4: 'impact_4',
} as const;

export type AudioKey = keyof typeof AUDIO_KEYS;

// =============================================================================
// AudioManager
// =============================================================================

/**
 * Manages all game audio including voice clips and sound effects.
 * Singleton pattern for easy access across scenes.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private scene: Phaser.Scene | null = null;
  private volume = 1.0;
  private muted = false;
  private currentlyPlaying: Phaser.Sound.BaseSound | null = null;

  private constructor() {}

  /**
   * Get the AudioManager singleton instance.
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the AudioManager with a scene.
   * Call this in each scene's create() method.
   */
  public init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Load all audio assets. Call in PreloadScene.
   */
  public static loadAudio(scene: Phaser.Scene): void {
    logger.info('Loading audio assets...');

    // Impact sounds are mp3, voice clips are ogg
    const mp3Keys = ['impact_1', 'impact_2', 'impact_3', 'impact_4'];

    for (const key of Object.values(AUDIO_KEYS)) {
      const ext = mp3Keys.includes(key) ? 'mp3' : 'ogg';
      scene.load.audio(key, `audio/${key}.${ext}`);
    }
  }

  /**
   * Play an audio clip.
   * @param key The audio key to play
   * @param interrupt If true, stops any currently playing audio first
   */
  public play(key: AudioKey, interrupt = true): void {
    if (!this.scene || this.muted) return;

    try {
      if (interrupt && this.currentlyPlaying?.isPlaying) {
        this.currentlyPlaying.stop();
      }

      const sound = this.scene.sound.add(key, { volume: this.volume });
      sound.play();
      this.currentlyPlaying = sound;

      // Clean up when done
      sound.once('complete', () => {
        if (this.currentlyPlaying === sound) {
          this.currentlyPlaying = null;
        }
      });
    } catch (error) {
      logger.warn(`Failed to play audio: ${key}`, error);
    }
  }

  /**
   * Play a sequence of audio clips with delays.
   * @param sequence Array of { key, delay } where delay is ms before playing
   */
  public playSequence(sequence: Array<{ key: AudioKey; delay: number }>): void {
    if (!this.scene || this.muted) return;

    let accumulatedDelay = 0;
    for (const { key, delay } of sequence) {
      accumulatedDelay += delay;
      this.scene.time.delayedCall(accumulatedDelay, () => {
        this.play(key, false);
      });
    }
  }

  /**
   * Play the round announcement based on round number.
   */
  public playRound(roundNumber: number): void {
    const roundKeys: Record<number, AudioKey> = {
      1: 'round_1',
      2: 'round_2',
      3: 'round_3',
      4: 'round_4',
      5: 'round_5',
    };

    const key = roundKeys[roundNumber];
    if (key) {
      this.play(key);
    }
  }

  /**
   * Play a number announcement (1-10).
   */
  public playNumber(num: number): void {
    if (num >= 1 && num <= 10) {
      this.play(num.toString() as AudioKey);
    }
  }

  /**
   * Set the master volume (0.0 - 1.0).
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get the current volume.
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Toggle mute state.
   */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted && this.currentlyPlaying?.isPlaying) {
      this.currentlyPlaying.stop();
    }
    return this.muted;
  }

  /**
   * Check if audio is muted.
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Stop any currently playing audio.
   */
  public stop(): void {
    if (this.currentlyPlaying?.isPlaying) {
      this.currentlyPlaying.stop();
      this.currentlyPlaying = null;
    }
  }

  /**
   * Play a random impact sound effect.
   * Does not interrupt other sounds (allows overlapping).
   */
  public playImpact(): void {
    if (!this.scene || this.muted) return;

    try {
      const impactKeys: AudioKey[] = ['impact_1', 'impact_2', 'impact_3', 'impact_4'];
      const randomIndex = Math.floor(Math.random() * impactKeys.length);
      const randomKey = impactKeys[randomIndex] ?? 'impact_1';
      
      // Play impact sound without interrupting other sounds
      // Use lower volume for SFX to not overpower voice clips
      const sound = this.scene.sound.add(randomKey, { volume: this.volume * 0.7 });
      sound.play();
    } catch (error) {
      logger.warn('Failed to play impact sound', error);
    }
  }
}

/**
 * Convenience function to get the AudioManager instance.
 */
export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}
