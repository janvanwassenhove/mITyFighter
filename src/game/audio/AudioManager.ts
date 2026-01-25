/**
 * @fileoverview Audio management for game sounds and announcer voice clips
 * Supports dynamic loading from JSON for easy extensibility.
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */

import type Phaser from 'phaser';

import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Audio entry in the JSON registry
 */
export interface AudioRegistryEntry {
  /** Unique identifier */
  readonly id: string;
  /** Display name for UI */
  readonly displayName: string;
  /** Description of the audio */
  readonly description: string;
  /** Filename relative to audio folder */
  readonly file: string;
  /** Audio category */
  readonly category: 'announcer' | 'impact' | 'music' | 'ui' | 'sfx';
}

/**
 * JSON structure for audio data file
 */
export interface AudioJsonData {
  audio: AudioRegistryEntry[];
}

// =============================================================================
// Dynamic Registry Storage
// =============================================================================

/** Dynamic audio registry (populated from JSON) */
let audioRegistry: Record<string, AudioRegistryEntry> = {};

/** Array of all audio IDs (populated from JSON) */
let audioIds: string[] = [];

/** Flag to check if registry is loaded */
let isLoaded = false;

// =============================================================================
// JSON Loading
// =============================================================================

/**
 * Load audio registry from JSON file.
 * Call this during game initialization before accessing registry.
 * 
 * @returns Promise that resolves when audio registry is loaded
 */
export async function loadAudioFromJson(): Promise<void> {
  try {
    // eslint-disable-next-line no-undef
    const response = await fetch('data/audio.json');
    if (!response.ok) {
      throw new Error(`Failed to load audio.json: ${response.status}`);
    }
    
    const data: AudioJsonData = await response.json();
    
    // Build registry from JSON data
    audioRegistry = {};
    audioIds = [];
    
    for (const audio of data.audio) {
      audioRegistry[audio.id] = audio;
      audioIds.push(audio.id);
    }
    
    isLoaded = true;
    // eslint-disable-next-line no-console
    console.log(`Loaded ${audioIds.length} audio entries from JSON`);
  } catch (error) {
    console.error('Error loading audio from JSON:', error);
    throw error;
  }
}

/**
 * Check if audio registry is loaded.
 * @returns True if registry has been loaded from JSON
 */
export function isAudioRegistryLoaded(): boolean {
  return isLoaded;
}

/**
 * Get an audio registry entry by ID.
 * @param id Audio identifier
 * @returns Audio registry entry or undefined
 */
export function getAudioEntry(id: string): AudioRegistryEntry | undefined {
  return audioRegistry[id];
}

/**
 * Get all audio entries by category.
 * @param category Audio category to filter by
 * @returns Array of audio entries in that category
 */
export function getAudioByCategory(category: AudioRegistryEntry['category']): AudioRegistryEntry[] {
  return Object.values(audioRegistry).filter(entry => entry.category === category);
}

/**
 * Get the audio registry object.
 * @returns Read-only audio registry
 */
export function getAudioRegistry(): Readonly<Record<string, AudioRegistryEntry>> {
  return audioRegistry;
}

/**
 * Get all audio IDs.
 * @returns Array of audio IDs
 */
export function getAudioIds(): readonly string[] {
  return audioIds;
}

// =============================================================================
// Legacy AUDIO_KEYS for backward compatibility
// =============================================================================

/**
 * All available audio clip keys.
 * Now dynamically populated from JSON, but maintains the same interface.
 */
export const AUDIO_KEYS = new Proxy({} as Record<string, string>, {
  get(_, prop: string): string {
    return audioRegistry[prop]?.id ?? prop;
  },
  ownKeys(): string[] {
    return audioIds;
  },
  getOwnPropertyDescriptor(_, prop: string): PropertyDescriptor | undefined {
    const entry = audioRegistry[prop];
    if (entry) {
      return {
        enumerable: true,
        configurable: true,
        value: entry.id,
      };
    }
    return undefined;
  },
  has(_, prop: string): boolean {
    return prop in audioRegistry;
  },
});

export type AudioKey = string;

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
  private musicVolume = 0.5;
  private muted = false;
  private currentlyPlaying: Phaser.Sound.BaseSound | null = null;
  private backgroundMusic: Phaser.Sound.BaseSound | null = null;

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
   * Requires audio registry to be loaded from JSON first.
   */
  public static loadAudio(scene: Phaser.Scene): void {
    if (!isLoaded) {
      logger.warn('Audio registry not loaded from JSON, skipping audio load');
      return;
    }
    
    logger.info(`Loading ${audioIds.length} audio assets...`);

    for (const entry of Object.values(audioRegistry)) {
      scene.load.audio(entry.id, `audio/${entry.file}`);
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
    
    // Update background music volume
    if (this.backgroundMusic && 'setVolume' in this.backgroundMusic) {
      (this.backgroundMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.muted ? 0 : this.musicVolume
      );
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
      // Get all impact sounds from the registry
      const impactSounds = getAudioByCategory('impact');
      if (impactSounds.length === 0) {
        logger.warn('No impact sounds found in audio registry');
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * impactSounds.length);
      const randomSound = impactSounds[randomIndex];
      
      if (!randomSound) return;
      
      // Play impact sound without interrupting other sounds
      // Use lower volume for SFX to not overpower voice clips
      const sound = this.scene.sound.add(randomSound.id, { volume: this.volume * 0.7 });
      sound.play();
    } catch (error) {
      logger.warn('Failed to play impact sound', error);
    }
  }

  /**
   * Play background music. Loops continuously.
   * @param trackId Optional specific track ID, or undefined for random from music category
   */
  public playMusic(trackId?: string): void {
    if (!this.scene) return;

    // Stop any existing music
    this.stopMusic();

    try {
      // Get all music tracks from the registry
      const musicTracks = getAudioByCategory('music');
      if (musicTracks.length === 0) {
        logger.warn('No music tracks found in audio registry');
        return;
      }
      
      // Select track
      let selectedTrack: AudioRegistryEntry | undefined;
      if (trackId) {
        selectedTrack = musicTracks.find(t => t.id === trackId);
      }
      if (!selectedTrack) {
        const randomIndex = Math.floor(Math.random() * musicTracks.length);
        selectedTrack = musicTracks[randomIndex];
      }
      
      if (!selectedTrack) return;

      // Create and play looping music
      this.backgroundMusic = this.scene.sound.add(selectedTrack.id, {
        volume: this.muted ? 0 : this.musicVolume,
        loop: true,
      });
      this.backgroundMusic.play();
      
      logger.info(`Playing background music: ${selectedTrack.id}`);
    } catch (error) {
      logger.warn('Failed to play background music', error);
    }
  }

  /**
   * Stop background music.
   */
  public stopMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.destroy();
      this.backgroundMusic = null;
    }
  }

  /**
   * Set music volume (0.0 - 1.0).
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update currently playing music volume
    if (this.backgroundMusic && 'setVolume' in this.backgroundMusic) {
      (this.backgroundMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.muted ? 0 : this.musicVolume
      );
    }
  }

  /**
   * Get the current music volume.
   */
  public getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Check if music is currently playing.
   */
  public isMusicPlaying(): boolean {
    return this.backgroundMusic?.isPlaying ?? false;
  }
}

/**
 * Convenience function to get the AudioManager instance.
 */
export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}
