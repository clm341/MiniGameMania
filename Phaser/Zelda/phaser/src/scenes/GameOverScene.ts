// GameOverScene - Game over screen

import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, Colors } from '../config';
import { PlayerData } from '../types';
import { SaveSystem } from '../systems/SaveSystem';

export class GameOverScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private menuOptions: string[] = ['Continue', 'Load Game', 'Quit to Title'];
  private selectedIndex: number = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private selector!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { playerData: PlayerData }): void {
    this.playerData = data.playerData;
  }

  create(): void {
    // Fade in
    this.cameras.main.fadeIn(500);

    // Black background
    this.cameras.main.setBackgroundColor(0x000000);

    // Game Over text
    const gameOver = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
    });
    gameOver.setOrigin(0.5);

    // Flicker effect
    this.tweens.add({
      targets: gameOver,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Play time display
    const playTime = this.formatPlayTime(this.playerData.playTime);
    const timeText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3 + 60, `Time: ${playTime}`, {
      fontSize: '18px',
      color: '#888888',
    });
    timeText.setOrigin(0.5);

    // Menu options
    const startY = SCREEN_HEIGHT / 2 + 50;
    const spacing = 40;

    this.menuTexts = [];
    this.menuOptions.forEach((option, index) => {
      // Dim "Load Game" if no save exists
      const color = (option === 'Load Game' && !SaveSystem.hasSave()) ? '#555555' : '#ffffff';

      const text = this.add.text(SCREEN_WIDTH / 2, startY + index * spacing, option, {
        fontSize: '24px',
        color: color,
      });
      text.setOrigin(0.5);
      this.menuTexts.push(text);
    });

    // Selector
    this.selector = this.add.text(SCREEN_WIDTH / 2 - 100, startY, '>', {
      fontSize: '24px',
      color: '#ffd700',
    });
    this.selector.setOrigin(0.5);

    this.updateSelector();

    // Input
    this.input.keyboard!.on('keydown-UP', this.moveUp, this);
    this.input.keyboard!.on('keydown-W', this.moveUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    this.input.keyboard!.on('keydown-S', this.moveDown, this);
    this.input.keyboard!.on('keydown-ENTER', this.selectOption, this);
    this.input.keyboard!.on('keydown-Z', this.selectOption, this);
  }

  private formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private moveUp(): void {
    this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
    this.updateSelector();
  }

  private moveDown(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
    this.updateSelector();
  }

  private updateSelector(): void {
    const startY = SCREEN_HEIGHT / 2 + 50;
    const spacing = 40;
    this.selector.y = startY + this.selectedIndex * spacing;

    this.menuTexts.forEach((text, index) => {
      if (this.menuOptions[index] === 'Load Game' && !SaveSystem.hasSave()) {
        text.setColor('#555555');
      } else {
        text.setColor(index === this.selectedIndex ? '#ffd700' : '#ffffff');
      }
    });
  }

  private selectOption(): void {
    const option = this.menuOptions[this.selectedIndex];

    switch (option) {
      case 'Continue':
        this.continueGame();
        break;
      case 'Load Game':
        if (SaveSystem.hasSave()) {
          this.loadGame();
        }
        break;
      case 'Quit to Title':
        this.quitToTitle();
        break;
    }
  }

  private continueGame(): void {
    // Reset health and restart from last position
    this.playerData.health = this.playerData.maxHealth;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { newGame: false, playerData: this.playerData });
    });
  }

  private loadGame(): void {
    const saveData = SaveSystem.load();
    if (saveData) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { newGame: false, playerData: saveData.playerData });
      });
    }
  }

  private quitToTitle(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('TitleScene');
    });
  }
}
