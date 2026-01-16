// PauseScene - Pause menu overlay

import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, Colors } from '../config';
import { PlayerData } from '../types';
import { SaveSystem } from '../systems/SaveSystem';

export class PauseScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private menuOptions: string[] = ['Resume', 'Save Game', 'Quit to Title'];
  private selectedIndex: number = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private selector!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { playerData: PlayerData }): void {
    this.playerData = data.playerData;
  }

  create(): void {
    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT / 2,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      0x000000,
      0.7
    );

    // Pause text
    const title = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Menu options
    const startY = SCREEN_HEIGHT / 2;
    const spacing = 40;

    this.menuTexts = [];
    this.menuOptions.forEach((option, index) => {
      const text = this.add.text(SCREEN_WIDTH / 2, startY + index * spacing, option, {
        fontSize: '24px',
        color: '#ffffff',
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
    this.input.keyboard!.on('keydown-ESC', this.resume, this);

    // Controls hint
    const hint = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 50, 'ESC: Resume', {
      fontSize: '14px',
      color: '#888888',
    });
    hint.setOrigin(0.5);
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
    const startY = SCREEN_HEIGHT / 2;
    const spacing = 40;
    this.selector.y = startY + this.selectedIndex * spacing;

    this.menuTexts.forEach((text, index) => {
      text.setColor(index === this.selectedIndex ? '#ffd700' : '#ffffff');
    });
  }

  private selectOption(): void {
    const option = this.menuOptions[this.selectedIndex];

    switch (option) {
      case 'Resume':
        this.resume();
        break;
      case 'Save Game':
        this.saveGame();
        break;
      case 'Quit to Title':
        this.quitToTitle();
        break;
    }
  }

  private resume(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private saveGame(): void {
    const success = SaveSystem.save(this.playerData);

    // Show save confirmation
    const message = this.add.text(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT / 2 + 130,
      success ? 'Game Saved!' : 'Save Failed!',
      {
        fontSize: '18px',
        color: success ? '#00ff00' : '#ff0000',
      }
    );
    message.setOrigin(0.5);

    // Fade out message
    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 1500,
      delay: 500,
      onComplete: () => message.destroy(),
    });
  }

  private quitToTitle(): void {
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.stop();
    this.scene.start('TitleScene');
  }
}
