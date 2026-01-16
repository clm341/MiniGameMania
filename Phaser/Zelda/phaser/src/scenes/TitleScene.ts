// TitleScene - Title screen with menu

import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, Colors, SCALE } from '../config';
import { SaveSystem } from '../systems/SaveSystem';

export class TitleScene extends Phaser.Scene {
  private menuOptions: string[] = ['New Game', 'Continue', 'Options'];
  private selectedIndex: number = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private selector!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor(Colors.DARK_BLUE);

    // Title
    const title = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4, 'ZELDA', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4 + 60, 'A LINK TO THE PAST', {
      fontSize: '24px',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);

    // Clone edition text
    const clone = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4 + 90, 'Clone Edition', {
      fontSize: '16px',
      color: '#88ccff',
    });
    clone.setOrigin(0.5);

    // Menu options
    this.menuTexts = [];
    const startY = SCREEN_HEIGHT / 2 + 30;
    const spacing = 50;

    this.menuOptions.forEach((option, index) => {
      const text = this.add.text(SCREEN_WIDTH / 2, startY + index * spacing, option, {
        fontSize: '28px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      this.menuTexts.push(text);
    });

    // Selector arrow
    this.selector = this.add.text(
      SCREEN_WIDTH / 2 - 100,
      startY,
      '>',
      {
        fontSize: '28px',
        color: '#ffd700',
      }
    );
    this.selector.setOrigin(0.5);

    // Update selector position
    this.updateSelector();

    // Controls hint
    const hint = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 60, 'Arrow Keys: Navigate   Enter/Z: Select', {
      fontSize: '16px',
      color: '#888888',
    });
    hint.setOrigin(0.5);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.zKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Add keyboard event listeners
    this.input.keyboard!.on('keydown-UP', this.moveUp, this);
    this.input.keyboard!.on('keydown-W', this.moveUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    this.input.keyboard!.on('keydown-S', this.moveDown, this);
    this.input.keyboard!.on('keydown-ENTER', this.selectOption, this);
    this.input.keyboard!.on('keydown-Z', this.selectOption, this);

    // Add blinking animation to title
    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Check if save exists and update menu
    if (!SaveSystem.hasSave()) {
      this.menuTexts[1].setColor('#555555'); // Dim "Continue" if no save
    }
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
    const startY = SCREEN_HEIGHT / 2 + 30;
    const spacing = 50;
    this.selector.y = startY + this.selectedIndex * spacing;

    // Update text colors
    this.menuTexts.forEach((text, index) => {
      if (index === 1 && !SaveSystem.hasSave()) {
        text.setColor('#555555');
      } else {
        text.setColor(index === this.selectedIndex ? '#ffd700' : '#ffffff');
      }
    });
  }

  private selectOption(): void {
    const option = this.menuOptions[this.selectedIndex];

    switch (option) {
      case 'New Game':
        this.startNewGame();
        break;
      case 'Continue':
        if (SaveSystem.hasSave()) {
          this.continueGame();
        }
        break;
      case 'Options':
        // TODO: Options menu
        break;
    }
  }

  private startNewGame(): void {
    // Fade out and start game
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { newGame: true });
    });
  }

  private continueGame(): void {
    const saveData = SaveSystem.load();
    if (saveData) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { newGame: false, playerData: saveData.playerData });
      });
    }
  }
}
