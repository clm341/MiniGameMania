import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    // Dim background
    const overlay = this.add.rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0x000000, 0.7);
    overlay.setOrigin(0, 0);

    // Pause title
    const title = this.add.text(SCREEN_WIDTH / 2, 200, 'PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0.5);

    // Resume button
    const resumeBtn = this.add.text(SCREEN_WIDTH / 2, 350, 'Resume', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 30, y: 15 },
    });
    resumeBtn.setOrigin(0.5, 0.5);
    resumeBtn.setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => {
      resumeBtn.setStyle({ backgroundColor: '#0088ff' });
    });
    resumeBtn.on('pointerout', () => {
      resumeBtn.setStyle({ backgroundColor: '#0066cc' });
    });
    resumeBtn.on('pointerdown', () => {
      this.resumeGame();
    });

    // Restart button
    const restartBtn = this.add.text(SCREEN_WIDTH / 2, 430, 'Restart Race', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#cc6600',
      padding: { x: 30, y: 15 },
    });
    restartBtn.setOrigin(0.5, 0.5);
    restartBtn.setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => {
      restartBtn.setStyle({ backgroundColor: '#ff8800' });
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setStyle({ backgroundColor: '#cc6600' });
    });
    restartBtn.on('pointerdown', () => {
      this.restartRace();
    });

    // Quit button
    const quitBtn = this.add.text(SCREEN_WIDTH / 2, 510, 'Quit to Menu', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#cc0000',
      padding: { x: 30, y: 15 },
    });
    quitBtn.setOrigin(0.5, 0.5);
    quitBtn.setInteractive({ useHandCursor: true });

    quitBtn.on('pointerover', () => {
      quitBtn.setStyle({ backgroundColor: '#ff0000' });
    });
    quitBtn.on('pointerout', () => {
      quitBtn.setStyle({ backgroundColor: '#cc0000' });
    });
    quitBtn.on('pointerdown', () => {
      this.quitToMenu();
    });

    // ESC to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resumeGame();
    });

    // Instructions
    const instructions = this.add.text(SCREEN_WIDTH / 2, 620, 'Press ESC to resume', {
      fontSize: '18px',
      color: '#888888',
    });
    instructions.setOrigin(0.5, 0.5);
  }

  private resumeGame() {
    this.scene.stop();
    this.scene.resume('RaceScene');
  }

  private restartRace() {
    this.scene.stop('UIScene');
    this.scene.stop();
    this.scene.start('RaceScene', { settings: { difficulty: 'medium', laps: 3, aiCount: 7 } });
  }

  private quitToMenu() {
    this.scene.stop('UIScene');
    this.scene.stop('RaceScene');
    this.scene.stop();
    this.scene.start('TitleScene');
  }
}
