/**
 * @fileoverview Settings screen with configurable controls
 * @description Allows players to view and customize key bindings
 */

/* eslint-disable no-undef */
/* global localStorage */

import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT, PlayerId } from '../config/constants';
import { getP1Bindings, P2_BINDINGS_NUMPAD, P2_BINDINGS_NO_NUMPAD, type KeyBinding } from '../input/InputBindings';
import { setKeyboardLayout, type KeyboardLayout } from '../input/KeyboardLayout';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

interface ControlDisplay {
  action: string;
  label: string;
  keyText: Phaser.GameObjects.Text;
  binding: KeyBinding;
}

// =============================================================================
// SettingsScene
// =============================================================================

export class SettingsScene extends Phaser.Scene {
  private selectedTab: 'p1' | 'p2' | 'options' = 'p1';
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private controlsContainer!: Phaser.GameObjects.Container;
  private controlDisplays: ControlDisplay[] = [];
  private selectedControlIndex = 0;
  private isRebinding = false;
  private rebindText?: Phaser.GameObjects.Text;
  
  // Settings state
  private useNumpad = true;
  private keyboardLayout: KeyboardLayout = 'qwerty';
  
  // Custom bindings storage (localStorage)
  private customP1Bindings: Map<string, string> = new Map();
  private customP2Bindings: Map<string, string> = new Map();

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    logger.info('SettingsScene started');

    // Initialize audio manager for this scene
    getAudioManager().init(this);

    // Load saved settings
    this.loadSettings();

    // Dark background
    this.cameras.main.setBackgroundColor('#0a0a15');

    // Create background effects
    this.createBackgroundEffects();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'SETTINGS', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '56px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true,
      },
    });
    title.setOrigin(0.5);
    title.setScale(0);

    // Animate title
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Create tabs
    this.createTabs();

    // Create controls container
    this.controlsContainer = this.add.container(0, 0);

    // Show P1 controls by default
    this.showTab('p1');

    // Instructions
    const instructions = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 35,
      '← → Switch tabs • ↑ ↓ Select • ENTER to rebind • ESC to go back',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    instructions.setOrigin(0.5);

    // Setup input
    this.setupInput();
  }

  /** Create tab buttons */
  private createTabs(): void {
    const tabs = [
      { key: 'p1', label: 'PLAYER 1' },
      { key: 'p2', label: 'PLAYER 2' },
      { key: 'options', label: 'OPTIONS' },
    ];

    const tabWidth = 200;
    const startX = GAME_WIDTH / 2 - tabWidth;
    const tabY = 130;

    tabs.forEach((tab, index) => {
      const container = this.add.container(startX + index * tabWidth, tabY);

      const bg = this.add.rectangle(0, 0, tabWidth - 10, 45, 0x222244, 0.8);
      bg.setStrokeStyle(2, 0x444466);
      bg.setInteractive({ useHandCursor: true });

      const label = this.add.text(0, 0, tab.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);

      container.add([bg, label]);
      this.tabButtons.push(container);

      // Click handler
      bg.on('pointerdown', () => {
        this.showTab(tab.key as 'p1' | 'p2' | 'options');
      });
    });
  }

  /** Show selected tab content */
  private showTab(tab: 'p1' | 'p2' | 'options'): void {
    this.selectedTab = tab;
    this.selectedControlIndex = 0;
    this.controlDisplays = [];
    this.controlsContainer.removeAll(true);

    // Update tab visuals
    this.tabButtons.forEach((container, index) => {
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const label = container.getAt(1) as Phaser.GameObjects.Text;
      
      const isSelected = 
        (index === 0 && tab === 'p1') ||
        (index === 1 && tab === 'p2') ||
        (index === 2 && tab === 'options');

      if (isSelected) {
        bg.setFillStyle(0x334477, 1);
        bg.setStrokeStyle(3, 0xffcc00);
        label.setColor('#ffcc00');
      } else {
        bg.setFillStyle(0x222244, 0.8);
        bg.setStrokeStyle(2, 0x444466);
        label.setColor('#ffffff');
      }
    });

    if (tab === 'p1') {
      this.showPlayerControls(PlayerId.P1);
    } else if (tab === 'p2') {
      this.showPlayerControls(PlayerId.P2);
    } else {
      this.showOptions();
    }

    this.updateControlSelection();
  }

  /** Show controls for a player */
  private showPlayerControls(player: PlayerId): void {
    const startY = 190;
    const rowHeight = 45;

    // Get bindings for this player
    const bindings = player === PlayerId.P1 
      ? getP1Bindings(this.keyboardLayout)
      : (this.useNumpad ? P2_BINDINGS_NUMPAD : P2_BINDINGS_NO_NUMPAD);

    // Action labels mapping
    const actionLabels: Record<string, string> = {
      left: 'Move Left',
      right: 'Move Right',
      up: 'Jump',
      down: 'Crouch',
      attack1: 'Attack 1 (Punch)',
      attack2: 'Attack 2 (Kick)',
      special: 'Special Attack',
      block: 'Block',
      cycleCharacterPrev: 'Prev Character',
      cycleCharacterNext: 'Next Character',
    };

    // Filter to game-relevant bindings
    const relevantBindings = bindings.filter(b => 
      ['left', 'right', 'up', 'down', 'attack1', 'attack2', 'special', 'block'].includes(b.action)
    );

    // Create two columns
    const leftCol = relevantBindings.slice(0, 4);  // Movement
    const rightCol = relevantBindings.slice(4);     // Combat

    // Column headers
    const movementHeader = this.add.text(GAME_WIDTH / 4, startY, '🎮 MOVEMENT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffcc00',
    });
    movementHeader.setOrigin(0.5);
    this.controlsContainer.add(movementHeader);

    const combatHeader = this.add.text(GAME_WIDTH * 3 / 4, startY, '⚔️ COMBAT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffcc00',
    });
    combatHeader.setOrigin(0.5);
    this.controlsContainer.add(combatHeader);

    // Left column (movement)
    leftCol.forEach((binding, index) => {
      this.createControlRow(
        GAME_WIDTH / 4,
        startY + 50 + index * rowHeight,
        actionLabels[binding.action] || binding.action,
        binding,
        player
      );
    });

    // Right column (combat)
    rightCol.forEach((binding, index) => {
      this.createControlRow(
        GAME_WIDTH * 3 / 4,
        startY + 50 + index * rowHeight,
        actionLabels[binding.action] || binding.action,
        binding,
        player
      );
    });

    // Hint text
    const hint = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 100,
      'Select a control and press ENTER to change the key binding',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#666666',
      }
    );
    hint.setOrigin(0.5);
    this.controlsContainer.add(hint);

    // Reset button
    const resetBtn = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 70,
      '[ Reset to Defaults ]',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ff6666',
      }
    );
    resetBtn.setOrigin(0.5);
    resetBtn.setInteractive({ useHandCursor: true });
    resetBtn.on('pointerover', () => resetBtn.setColor('#ff9999'));
    resetBtn.on('pointerout', () => resetBtn.setColor('#ff6666'));
    resetBtn.on('pointerdown', () => this.resetBindings(player));
    this.controlsContainer.add(resetBtn);
  }

  /** Create a single control row */
  private createControlRow(
    x: number,
    y: number,
    label: string,
    binding: KeyBinding,
    player: PlayerId
  ): void {
    // Background
    const bg = this.add.rectangle(x, y, 280, 38, 0x222244, 0.6);
    bg.setStrokeStyle(1, 0x333355);
    this.controlsContainer.add(bg);

    // Action label
    const actionText = this.add.text(x - 125, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cccccc',
    });
    actionText.setOrigin(0, 0.5);
    this.controlsContainer.add(actionText);

    // Get custom binding if exists
    const customBindings = player === PlayerId.P1 ? this.customP1Bindings : this.customP2Bindings;
    const displayKey = customBindings.get(binding.action) || this.formatKeyCode(binding.code);

    // Key binding display
    const keyText = this.add.text(x + 100, y, displayKey, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#66ff66',
      backgroundColor: '#113311',
      padding: { x: 8, y: 4 },
    });
    keyText.setOrigin(0.5);
    this.controlsContainer.add(keyText);

    // Store for selection
    this.controlDisplays.push({
      action: binding.action,
      label,
      keyText,
      binding,
    });

    // Make clickable
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.selectedControlIndex = this.controlDisplays.length - 1;
      this.updateControlSelection();
      this.startRebinding();
    });
  }

  /** Show options tab */
  private showOptions(): void {
    const startY = 220;
    const rowHeight = 60;

    // Keyboard Layout option
    const layoutLabel = this.add.text(GAME_WIDTH / 2 - 150, startY, 'Keyboard Layout:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cccccc',
    });
    layoutLabel.setOrigin(0, 0.5);
    this.controlsContainer.add(layoutLabel);

    const layoutValue = this.add.text(GAME_WIDTH / 2 + 100, startY, this.keyboardLayout.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#66ff66',
      backgroundColor: '#113311',
      padding: { x: 12, y: 6 },
    });
    layoutValue.setOrigin(0.5);
    layoutValue.setInteractive({ useHandCursor: true });
    layoutValue.on('pointerdown', () => {
      this.keyboardLayout = this.keyboardLayout === 'qwerty' ? 'azerty' : 'qwerty';
      setKeyboardLayout(this.keyboardLayout);
      layoutValue.setText(this.keyboardLayout.toUpperCase());
      this.saveSettings();
    });
    this.controlsContainer.add(layoutValue);

    // P2 Numpad option
    const numpadLabel = this.add.text(GAME_WIDTH / 2 - 150, startY + rowHeight, 'P2 Uses Numpad:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cccccc',
    });
    numpadLabel.setOrigin(0, 0.5);
    this.controlsContainer.add(numpadLabel);

    const numpadValue = this.add.text(GAME_WIDTH / 2 + 100, startY + rowHeight, this.useNumpad ? 'YES' : 'NO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: this.useNumpad ? '#66ff66' : '#ff6666',
      backgroundColor: this.useNumpad ? '#113311' : '#331111',
      padding: { x: 12, y: 6 },
    });
    numpadValue.setOrigin(0.5);
    numpadValue.setInteractive({ useHandCursor: true });
    numpadValue.on('pointerdown', () => {
      this.useNumpad = !this.useNumpad;
      numpadValue.setText(this.useNumpad ? 'YES' : 'NO');
      numpadValue.setColor(this.useNumpad ? '#66ff66' : '#ff6666');
      numpadValue.setBackgroundColor(this.useNumpad ? '#113311' : '#331111');
      this.saveSettings();
    });
    this.controlsContainer.add(numpadValue);

    // Info text
    const infoText = this.add.text(
      GAME_WIDTH / 2,
      startY + rowHeight * 2 + 20,
      'QWERTY: WASD for movement\nAZERTY: ZQSD for movement\n\nNumpad: P2 uses arrow keys + numpad\nNo Numpad: P2 uses IJKL + UOPY',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
        lineSpacing: 6,
      }
    );
    infoText.setOrigin(0.5, 0);
    this.controlsContainer.add(infoText);

    // Reset all button
    const resetAllBtn = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 100,
      '[ Reset All Settings ]',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ff6666',
      }
    );
    resetAllBtn.setOrigin(0.5);
    resetAllBtn.setInteractive({ useHandCursor: true });
    resetAllBtn.on('pointerover', () => resetAllBtn.setColor('#ff9999'));
    resetAllBtn.on('pointerout', () => resetAllBtn.setColor('#ff6666'));
    resetAllBtn.on('pointerdown', () => this.resetAllSettings());
    this.controlsContainer.add(resetAllBtn);
  }

  /** Update visual selection for controls */
  private updateControlSelection(): void {
    this.controlDisplays.forEach((display, index) => {
      const isSelected = index === this.selectedControlIndex;
      display.keyText.setColor(isSelected ? '#ffff00' : '#66ff66');
      display.keyText.setBackgroundColor(isSelected ? '#333300' : '#113311');
    });
  }

  /** Start rebinding a control */
  private startRebinding(): void {
    if (this.selectedTab === 'options') return;
    
    const display = this.controlDisplays[this.selectedControlIndex];
    if (!display) return;

    this.isRebinding = true;

    // Show rebinding prompt
    this.rebindText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Press any key...\n\n(ESC to cancel)',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 40, y: 30 },
        align: 'center',
      }
    );
    this.rebindText.setOrigin(0.5);
    this.rebindText.setDepth(100);

    // Flash the key text
    this.tweens.add({
      targets: display.keyText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Handle rebinding key press */
  private handleRebind(event: KeyboardEvent): void {
    if (!this.isRebinding) return;

    // Cancel on ESC
    if (event.code === 'Escape') {
      this.cancelRebinding();
      return;
    }

    const display = this.controlDisplays[this.selectedControlIndex];
    if (!display) return;

    // Update the binding
    const newKey = this.formatKeyCode(event.code);
    display.keyText.setText(newKey);

    // Store custom binding
    const customBindings = this.selectedTab === 'p1' ? this.customP1Bindings : this.customP2Bindings;
    customBindings.set(display.action, newKey);

    this.cancelRebinding();
    this.saveSettings();

    logger.info(`Rebound ${display.action} to ${event.code}`);
  }

  /** Cancel rebinding mode */
  private cancelRebinding(): void {
    this.isRebinding = false;

    if (this.rebindText) {
      this.rebindText.destroy();
      delete this.rebindText;
    }

    // Stop flashing
    const display = this.controlDisplays[this.selectedControlIndex];
    if (display) {
      this.tweens.killTweensOf(display.keyText);
      display.keyText.setAlpha(1);
    }

    this.updateControlSelection();
  }

  /** Format key code for display */
  private formatKeyCode(code: string): string {
    // Remove common prefixes and make readable
    const formatted = code
      .replace('Key', '')
      .replace('Digit', '')
      .replace('Arrow', '↑↓←→'.includes(code.replace('Arrow', '')) ? '' : '')
      .replace('Numpad', 'Num ')
      .replace('Left', '←')
      .replace('Right', '→')
      .replace('Up', '↑')
      .replace('Down', '↓');
    
    return formatted || code;
  }

  /** Reset bindings for a player */
  private resetBindings(player: PlayerId): void {
    if (player === PlayerId.P1) {
      this.customP1Bindings.clear();
    } else {
      this.customP2Bindings.clear();
    }
    this.saveSettings();
    this.showTab(this.selectedTab);
  }

  /** Reset all settings */
  private resetAllSettings(): void {
    this.customP1Bindings.clear();
    this.customP2Bindings.clear();
    this.useNumpad = true;
    this.keyboardLayout = 'qwerty';
    setKeyboardLayout('qwerty');
    localStorage.removeItem('mityFighterSettings');
    this.showTab('options');
  }

  /** Load settings from localStorage */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('mityFighterSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.useNumpad = settings.useNumpad ?? true;
        this.keyboardLayout = settings.keyboardLayout ?? 'qwerty';
        setKeyboardLayout(this.keyboardLayout);
        
        if (settings.customP1Bindings) {
          this.customP1Bindings = new Map(Object.entries(settings.customP1Bindings));
        }
        if (settings.customP2Bindings) {
          this.customP2Bindings = new Map(Object.entries(settings.customP2Bindings));
        }
      }
    } catch (e) {
      logger.warn('Failed to load settings:', e);
    }
  }

  /** Save settings to localStorage */
  private saveSettings(): void {
    try {
      const settings = {
        useNumpad: this.useNumpad,
        keyboardLayout: this.keyboardLayout,
        customP1Bindings: Object.fromEntries(this.customP1Bindings),
        customP2Bindings: Object.fromEntries(this.customP2Bindings),
      };
      localStorage.setItem('mityFighterSettings', JSON.stringify(settings));
    } catch (e) {
      logger.warn('Failed to save settings:', e);
    }
  }

  /** Create animated background */
  private createBackgroundEffects(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Floating particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);

      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }

    // Animated gradient bars
    for (let i = 0; i < 3; i++) {
      const bar = this.add.rectangle(
        0,
        200 + i * 150,
        GAME_WIDTH * 2,
        50,
        0x44ff44,
        0.02
      );
      bar.setOrigin(0, 0.5);
      bar.setDepth(-1);

      this.tweens.add({
        targets: bar,
        x: -GAME_WIDTH,
        duration: 12000 + i * 3000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  /** Setup keyboard input */
  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    // Remove any existing listeners
    keyboard.removeAllListeners();

    // Navigation (when not rebinding)
    keyboard.on('keydown-LEFT', () => {
      if (this.isRebinding) return;
      const tabs: ('p1' | 'p2' | 'options')[] = ['p1', 'p2', 'options'];
      const currentIndex = tabs.indexOf(this.selectedTab);
      if (currentIndex > 0) {
        this.showTab(tabs[currentIndex - 1]!);
      }
    });

    keyboard.on('keydown-RIGHT', () => {
      if (this.isRebinding) return;
      const tabs: ('p1' | 'p2' | 'options')[] = ['p1', 'p2', 'options'];
      const currentIndex = tabs.indexOf(this.selectedTab);
      if (currentIndex < tabs.length - 1) {
        this.showTab(tabs[currentIndex + 1]!);
      }
    });

    keyboard.on('keydown-UP', () => {
      if (this.isRebinding || this.selectedTab === 'options') return;
      if (this.selectedControlIndex > 0) {
        this.selectedControlIndex--;
        this.updateControlSelection();
      }
    });

    keyboard.on('keydown-DOWN', () => {
      if (this.isRebinding || this.selectedTab === 'options') return;
      if (this.selectedControlIndex < this.controlDisplays.length - 1) {
        this.selectedControlIndex++;
        this.updateControlSelection();
      }
    });

    keyboard.on('keydown-ENTER', () => {
      if (this.isRebinding) return;
      if (this.selectedTab !== 'options') {
        this.startRebinding();
      }
    });

    // Handle rebinding
    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (this.isRebinding) {
        this.handleRebind(event);
      }
    });

    // Go back
    keyboard.on('keydown-ESC', () => {
      if (this.isRebinding) {
        this.cancelRebinding();
      } else {
        this.goBack();
      }
    });
  }

  /** Return to title scene */
  private goBack(): void {
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('TitleScene', { showMenu: true });
    });
  }
}
