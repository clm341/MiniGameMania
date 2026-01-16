// BootScene - Asset preloading and sprite generation

import Phaser from 'phaser';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { SCREEN_WIDTH, SCREEN_HEIGHT, Colors } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading bar
    this.createLoadingBar();
  }

  create(): void {
    // Generate all pixel art sprites
    const spriteGenerator = new SpriteGenerator(this);
    spriteGenerator.generateAllSprites();

    // Create animations
    this.createAnimations();

    // Transition to title screen
    this.scene.start('TitleScene');
  }

  private createLoadingBar(): void {
    const width = SCREEN_WIDTH;
    const height = SCREEN_HEIGHT;

    // Background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, Colors.DARK_BLUE);

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Progress bar background
    const progressBarBg = this.add.rectangle(width / 2, height / 2 + 20, 400, 30, 0x333333);

    // Progress bar
    const progressBar = this.add.rectangle(width / 2 - 195, height / 2 + 20, 0, 24, Colors.GOLD);
    progressBar.setOrigin(0, 0.5);

    // Update progress (simulated since we're generating sprites)
    this.time.addEvent({
      delay: 50,
      repeat: 8,
      callback: () => {
        progressBar.width += 43;
      },
    });
  }

  private createAnimations(): void {
    const directions = ['down', 'up', 'left', 'right'];

    // Player walk animations - faster for snappy movement
    directions.forEach((dir) => {
      this.anims.create({
        key: `player_walk_${dir}`,
        frames: this.anims.generateFrameNumbers(`player_walk_${dir}`, { start: 0, end: 3 }),
        frameRate: 15,  // Faster walk cycle
        repeat: -1,
      });
    });

    // Player attack animations - very fast sword swings
    directions.forEach((dir) => {
      this.anims.create({
        key: `player_attack_${dir}`,
        frames: this.anims.generateFrameNumbers(`player_attack_${dir}`, { start: 0, end: 2 }),
        frameRate: 24,  // Quick attack
        repeat: 0,
      });
    });

    // Enemy animations - faster
    const enemyTypes = ['soldier_green', 'soldier_blue', 'octorok', 'keese', 'stalfos', 'moblin'];
    enemyTypes.forEach((type) => {
      this.anims.create({
        key: `enemy_${type}_walk`,
        frames: this.anims.generateFrameNumbers(`enemy_${type}`, { start: 0, end: 1 }),
        frameRate: 10,  // Faster enemy animation
        repeat: -1,
      });
    });

    // Explosion animation - fast
    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 3 }),
      frameRate: 16,
      repeat: 0,
    });

    // Fairy animation
    this.anims.create({
      key: 'fairy_float',
      frames: this.anims.generateFrameNumbers('item_fairy', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1,
    });

    // Torch animation
    this.anims.create({
      key: 'torch_flicker',
      frames: this.anims.generateFrameNumbers('tile_torch', { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });
  }
}
