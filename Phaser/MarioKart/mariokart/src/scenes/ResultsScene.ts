import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config';
import { RaceResult, ResultsSceneData } from '../types';

export class ResultsScene extends Phaser.Scene {
  private results: RaceResult[] = [];
  private raceTime: number = 0;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: ResultsSceneData) {
    this.results = data.results || [];
    this.raceTime = data.raceTime || 0;
  }

  create() {
    // Background
    const bg = this.add.rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0x1a1a2e);
    bg.setOrigin(0, 0);

    // Title
    const title = this.add.text(SCREEN_WIDTH / 2, 60, 'RACE RESULTS', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0.5);

    // Total race time
    const minutes = Math.floor(this.raceTime / 60000);
    const seconds = Math.floor((this.raceTime % 60000) / 1000);
    const ms = Math.floor(this.raceTime % 1000);
    const timeStr = `Total Time: ${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;

    const timeText = this.add.text(SCREEN_WIDTH / 2, 120, timeStr, {
      fontSize: '24px',
      color: '#aaaaaa',
    });
    timeText.setOrigin(0.5, 0.5);

    // Results list
    const startY = 180;
    const rowHeight = 50;

    this.results.slice(0, 8).forEach((result, index) => {
      const y = startY + index * rowHeight;
      const isPlayer = result.isPlayer;

      // Position
      const posText = this.add.text(100, y, `${result.position}.`, {
        fontSize: '28px',
        color: isPlayer ? '#ffff00' : '#ffffff',
        fontStyle: isPlayer ? 'bold' : 'normal',
      });

      // Name
      const name = isPlayer ? 'YOU' : `CPU ${result.position}`;
      const nameText = this.add.text(180, y, name, {
        fontSize: '28px',
        color: isPlayer ? '#ffff00' : '#ffffff',
        fontStyle: isPlayer ? 'bold' : 'normal',
      });

      // Time
      if (result.finishTime !== null) {
        const finishMinutes = Math.floor(result.finishTime / 60000);
        const finishSeconds = Math.floor((result.finishTime % 60000) / 1000);
        const finishMs = Math.floor(result.finishTime % 1000);
        const finishStr = `${finishMinutes}:${finishSeconds.toString().padStart(2, '0')}.${finishMs.toString().padStart(3, '0')}`;

        const finishText = this.add.text(SCREEN_WIDTH - 150, y, finishStr, {
          fontSize: '24px',
          color: isPlayer ? '#ffff00' : '#cccccc',
        });
        finishText.setOrigin(1, 0);
      } else {
        const dnfText = this.add.text(SCREEN_WIDTH - 150, y, 'DNF', {
          fontSize: '24px',
          color: '#ff4444',
        });
        dnfText.setOrigin(1, 0);
      }

      // Highlight player row
      if (isPlayer) {
        const highlight = this.add.rectangle(SCREEN_WIDTH / 2, y + 14, SCREEN_WIDTH - 100, rowHeight - 5, 0xffff00, 0.1);
      }
    });

    // Player position message
    const playerResult = this.results.find(r => r.isPlayer);
    if (playerResult) {
      let message = '';
      let color = '#ffffff';

      if (playerResult.position === 1) {
        message = 'WINNER!';
        color = '#ffd700';
      } else if (playerResult.position <= 3) {
        message = 'Great Race!';
        color = '#00ff00';
      } else if (playerResult.position <= 5) {
        message = 'Good Effort!';
        color = '#88ff88';
      } else {
        message = 'Better luck next time!';
        color = '#aaaaaa';
      }

      const msgText = this.add.text(SCREEN_WIDTH / 2, 600, message, {
        fontSize: '36px',
        color: color,
        fontStyle: 'bold',
      });
      msgText.setOrigin(0.5, 0.5);
    }

    // Buttons
    const playAgainBtn = this.add.text(SCREEN_WIDTH / 2 - 120, 670, 'Race Again', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 20, y: 10 },
    });
    playAgainBtn.setOrigin(0.5, 0.5);
    playAgainBtn.setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerover', () => playAgainBtn.setStyle({ backgroundColor: '#0088ff' }));
    playAgainBtn.on('pointerout', () => playAgainBtn.setStyle({ backgroundColor: '#0066cc' }));
    playAgainBtn.on('pointerdown', () => {
      this.scene.start('RaceScene', { settings: { difficulty: 'medium', laps: 3, aiCount: 7 } });
    });

    const menuBtn = this.add.text(SCREEN_WIDTH / 2 + 120, 670, 'Main Menu', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 20, y: 10 },
    });
    menuBtn.setOrigin(0.5, 0.5);
    menuBtn.setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#888888' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#666666' }));
    menuBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('RaceScene', { settings: { difficulty: 'medium', laps: 3, aiCount: 7 } });
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('TitleScene');
    });
  }
}
