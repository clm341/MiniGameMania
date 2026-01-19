import { Scene3D } from '@enable3d/phaser-extension';
import { SCREEN_WIDTH, SCREEN_HEIGHT, AI_DIFFICULTY, TOTAL_LAPS, AI_KART_COUNT } from '../config';
import { GameSettings, Difficulty } from '../types';

export class TitleScene extends Scene3D {
  private selectedDifficulty: Difficulty = 'medium';
  private difficultyButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'TitleScene' });
  }

  init() {
    this.accessThirdDimension();
  }

  create() {
    // Setup simple 3D background
    this.third.warpSpeed('camera', 'sky', 'light');

    // Add some spinning geometry in background
    const box = this.third.add.box({ x: 0, y: 0, z: -10, width: 2, height: 2, depth: 2 }, { lambert: { color: 0xff0000 } });

    this.time.addEvent({
      delay: 16,
      callback: () => {
        box.rotation.x += 0.01;
        box.rotation.y += 0.02;
      },
      loop: true,
    });

    // Title
    const title = this.add.text(SCREEN_WIDTH / 2, 100, 'MARIO KART RACING', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // Subtitle
    const subtitle = this.add.text(SCREEN_WIDTH / 2, 170, '3D Racing Experience', {
      fontSize: '24px',
      color: '#cccccc',
    });
    subtitle.setOrigin(0.5, 0.5);

    // Difficulty selection
    const diffLabel = this.add.text(SCREEN_WIDTH / 2, 280, 'Select Difficulty:', {
      fontSize: '28px',
      color: '#ffffff',
    });
    diffLabel.setOrigin(0.5, 0.5);

    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const diffNames = ['Easy', 'Medium', 'Hard'];

    difficulties.forEach((diff, index) => {
      const btn = this.add.text(
        SCREEN_WIDTH / 2 - 150 + index * 150,
        340,
        diffNames[index],
        {
          fontSize: '24px',
          color: diff === this.selectedDifficulty ? '#00ff00' : '#888888',
          backgroundColor: diff === this.selectedDifficulty ? '#004400' : '#222222',
          padding: { x: 20, y: 10 },
        }
      );
      btn.setOrigin(0.5, 0.5);
      btn.setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (diff !== this.selectedDifficulty) {
          btn.setStyle({ color: '#ffffff' });
        }
      });

      btn.on('pointerout', () => {
        if (diff !== this.selectedDifficulty) {
          btn.setStyle({ color: '#888888' });
        }
      });

      btn.on('pointerdown', () => {
        this.selectDifficulty(diff);
      });

      this.difficultyButtons.push(btn);
    });

    // Race info
    const info = this.add.text(SCREEN_WIDTH / 2, 440, `${TOTAL_LAPS} Laps | ${AI_KART_COUNT} AI Opponents`, {
      fontSize: '20px',
      color: '#aaaaaa',
    });
    info.setOrigin(0.5, 0.5);

    // Start button
    const startBtn = this.add.text(SCREEN_WIDTH / 2, 540, 'START RACE', {
      fontSize: '36px',
      color: '#ffffff',
      backgroundColor: '#0066cc',
      padding: { x: 40, y: 15 },
    });
    startBtn.setOrigin(0.5, 0.5);
    startBtn.setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setStyle({ backgroundColor: '#0088ff' });
    });

    startBtn.on('pointerout', () => {
      startBtn.setStyle({ backgroundColor: '#0066cc' });
    });

    startBtn.on('pointerdown', () => {
      this.startRace();
    });

    // Controls info
    const controls = this.add.text(SCREEN_WIDTH / 2, 650,
      'Controls: W/Up=Accelerate | S/Down=Brake | A/D or Left/Right=Steer | Space=Drift | Z=Use Item',
      {
        fontSize: '16px',
        color: '#666666',
      }
    );
    controls.setOrigin(0.5, 0.5);

    // Keyboard shortcut to start
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startRace();
    });
  }

  private selectDifficulty(diff: Difficulty) {
    this.selectedDifficulty = diff;
    const diffNames = ['Easy', 'Medium', 'Hard'];
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

    this.difficultyButtons.forEach((btn, index) => {
      const isSelected = difficulties[index] === diff;
      btn.setStyle({
        color: isSelected ? '#00ff00' : '#888888',
        backgroundColor: isSelected ? '#004400' : '#222222',
      });
    });
  }

  private startRace() {
    const settings: GameSettings = {
      difficulty: this.selectedDifficulty,
      laps: TOTAL_LAPS,
      aiCount: AI_KART_COUNT,
    };

    this.scene.start('RaceScene', { settings });
  }
}
