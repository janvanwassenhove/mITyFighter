/**
 * @fileoverview MK-style fight announcements
 * @description ROUND X, FIGHT!, KO, WINS announcements
 */

import type Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getActiveTheme } from '../config/themes';

// =============================================================================
// AnnouncerUI
// =============================================================================

/**
 * MK-style big text announcements.
 */
export class AnnouncerUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private mainText: Phaser.GameObjects.Text;
  private subText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setDepth(200);
    this.container.setVisible(false);

    const theme = getActiveTheme();

    // Main announcement text
    this.mainText = scene.add.text(0, -30, '', {
      fontFamily: theme.fonts.title,
      fontSize: '96px',
      color: theme.colors.text,
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    });
    this.mainText.setOrigin(0.5);
    this.container.add(this.mainText);

    // Sub text (e.g., player name)
    this.subText = scene.add.text(0, 50, '', {
      fontFamily: theme.fonts.title,
      fontSize: '48px',
      color: theme.colors.primary,
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.subText.setOrigin(0.5);
    this.container.add(this.subText);
  }

  /** Show "ROUND X" announcement */
  public showRound(roundNumber: number, callback?: () => void): void {
    this.mainText.setText(`ROUND ${roundNumber}`);
    this.mainText.setColor('#ffffff');
    this.subText.setText('');
    
    // Play round voice clip
    getAudioManager().playRound(roundNumber);
    
    this.show(1500, callback);
  }

  /** Show "FIGHT!" announcement */
  public showFight(callback?: () => void): void {
    const theme = getActiveTheme();
    this.mainText.setText('FIGHT!');
    this.mainText.setColor(theme.colors.highlight);
    this.subText.setText('');
    
    // Play fight voice clip
    getAudioManager().play('fight');
    
    this.show(1000, callback, true);
  }

  /** Show "K.O." announcement */
  public showKO(callback?: () => void): void {
    const theme = getActiveTheme();
    this.mainText.setText('K.O.');
    this.mainText.setColor(theme.colors.highlight);
    this.subText.setText('');
    this.show(1500, callback, true);
  }

  /** Show "TIME!" announcement */
  public showTimeUp(callback?: () => void): void {
    const theme = getActiveTheme();
    this.mainText.setText('TIME!');
    this.mainText.setColor(theme.colors.primary);
    this.subText.setText('');
    
    // Play time voice clip
    getAudioManager().play('time');
    
    this.show(1500, callback);
  }

  /** Show "X WINS" announcement */
  public showWins(playerName: string, callback?: () => void): void {
    this.mainText.setText('WINS');
    this.mainText.setColor('#00ff00');
    this.subText.setText(playerName.toUpperCase());
    
    // Play winner voice clip
    getAudioManager().play('winner');
    
    this.show(2000, callback);
  }

  /** Show "DRAW" announcement */
  public showDraw(callback?: () => void): void {
    this.mainText.setText('DRAW');
    this.mainText.setColor('#ffffff');
    this.subText.setText('');
    
    // Play tie voice clip
    getAudioManager().play('tie');
    
    this.show(1500, callback);
  }

  /** Show victory screen */
  public showVictory(playerName: string, callback?: () => void): void {
    this.mainText.setText(`${playerName.toUpperCase()}`);
    this.mainText.setColor('#ffcc00');
    this.subText.setText('WINS THE MATCH!');
    
    // Play flawless victory or you_win voice clip
    getAudioManager().play('you_win');
    
    this.show(3000, callback);
  }

  /** Show "FLAWLESS VICTORY" announcement */
  public showFlawlessVictory(playerName: string, callback?: () => void): void {
    this.mainText.setText('FLAWLESS VICTORY');
    this.mainText.setColor('#ffcc00');
    this.subText.setText(playerName.toUpperCase());
    
    // Play flawless victory voice clip
    getAudioManager().play('flawless_victory');
    
    this.show(3000, callback, true);
  }

  /** Show "FINAL ROUND" announcement */
  public showFinalRound(callback?: () => void): void {
    this.mainText.setText('FINAL ROUND');
    this.mainText.setColor('#ff4444');
    this.subText.setText('');
    
    // Play final round voice clip
    getAudioManager().play('final_round');
    
    this.show(1500, callback, true);
  }

  /** Show "GAME OVER" announcement */
  public showGameOver(callback?: () => void): void {
    this.mainText.setText('GAME OVER');
    this.mainText.setColor('#ff0000');
    this.subText.setText('');
    
    // Play game over voice clip
    getAudioManager().play('game_over');
    
    this.show(2500, callback);
  }

  /** Show the announcement with animation */
  private show(
    duration: number,
    callback?: () => void,
    shake: boolean = false
  ): void {
    this.container.setVisible(true);
    this.container.setScale(0);
    this.container.setAlpha(1);

    // Scale up animation
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (shake) {
          this.scene.cameras.main.shake(100, 0.01);
        }
      },
    });

    // Hold then fade
    this.scene.time.delayedCall(duration - 300, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          this.container.setVisible(false);
          callback?.();
        },
      });
    });
  }

  /** Hide immediately */
  public hide(): void {
    this.container.setVisible(false);
  }

  /** Destroy */
  public destroy(): void {
    this.container.destroy();
  }
}
