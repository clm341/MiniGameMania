import { Scene3D } from '@enable3d/phaser-extension';

export class BootScene extends Scene3D {
  constructor() {
    super({ key: 'BootScene' });
  }

  init() {
    this.accessThirdDimension();
  }

  preload() {
    // Display loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    // Simulate loading time for assets
    this.time.delayedCall(500, () => {
      loadingText.setText('Initializing 3D Engine...');
    });
  }

  create() {
    // Transition to title scene
    this.time.delayedCall(1000, () => {
      this.scene.start('TitleScene');
    });
  }
}
