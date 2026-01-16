// UIScene - HUD overlay showing health, magic, items, etc.

import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, HUD_HEIGHT, SCALE, Colors } from '../config';
import { PlayerData } from '../types';

export class UIScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private magicBar!: Phaser.GameObjects.Rectangle;
  private magicBarBg!: Phaser.GameObjects.Rectangle;
  private rupeeText!: Phaser.GameObjects.Text;
  private bombText!: Phaser.GameObjects.Text;
  private arrowText!: Phaser.GameObjects.Text;
  private keyText!: Phaser.GameObjects.Text;
  private equippedItemBox!: Phaser.GameObjects.Rectangle;
  private equippedItemText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { playerData: PlayerData }): void {
    this.playerData = data.playerData;
  }

  create(): void {
    // HUD background
    const hudBg = this.add.rectangle(0, 0, SCREEN_WIDTH, HUD_HEIGHT, Colors.DARK_BLUE);
    hudBg.setOrigin(0, 0);
    hudBg.setAlpha(0.9);

    // HUD border
    const border = this.add.rectangle(0, HUD_HEIGHT - 2, SCREEN_WIDTH, 2, Colors.WHITE);
    border.setOrigin(0, 0);

    // Create hearts
    this.createHearts();

    // Create magic bar
    this.createMagicBar();

    // Create counters
    this.createCounters();

    // Create equipped item display
    this.createEquippedItemDisplay();

    // Create minimap placeholder
    this.createMinimap();

    // Create controls hint
    this.createControlsHint();

    // Listen for player data updates
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('playerDataUpdate', this.updateUI, this);
  }

  private createHearts(): void {
    const startX = 15;
    const startY = 15;
    const heartSize = 12 * SCALE / 2;
    const spacing = heartSize + 4;
    const heartsPerRow = 10;

    const maxHearts = this.playerData.maxHealth / 2;

    for (let i = 0; i < maxHearts; i++) {
      const row = Math.floor(i / heartsPerRow);
      const col = i % heartsPerRow;

      const heart = this.add.sprite(
        startX + col * spacing,
        startY + row * (heartSize + 2),
        'item_heart_full'
      );
      heart.setScale(SCALE / 3);
      heart.setOrigin(0, 0);
      this.hearts.push(heart);
    }

    this.updateHearts();
  }

  private updateHearts(): void {
    const health = this.playerData.health;
    const maxHearts = this.playerData.maxHealth / 2;

    for (let i = 0; i < this.hearts.length; i++) {
      const heartHP = (i + 1) * 2;

      if (health >= heartHP) {
        this.hearts[i].setTexture('item_heart_full');
      } else if (health >= heartHP - 1) {
        this.hearts[i].setTexture('item_heart_half');
      } else {
        this.hearts[i].setTexture('item_heart_empty');
      }
    }
  }

  private createMagicBar(): void {
    const x = 15;
    const y = 50;
    const width = 100;
    const height = 12;

    // Background
    this.magicBarBg = this.add.rectangle(x, y, width, height, 0x333333);
    this.magicBarBg.setOrigin(0, 0);

    // Fill
    this.magicBar = this.add.rectangle(x + 2, y + 2, width - 4, height - 4, Colors.MAGIC_GREEN);
    this.magicBar.setOrigin(0, 0);

    // Border
    const border = this.add.rectangle(x, y, width, height);
    border.setOrigin(0, 0);
    border.setStrokeStyle(1, Colors.WHITE);

    // Label
    const label = this.add.text(x + width + 10, y, 'MP', {
      fontSize: '12px',
      color: '#ffffff',
    });
  }

  private updateMagicBar(): void {
    const ratio = this.playerData.magic / this.playerData.maxMagic;
    this.magicBar.width = (100 - 4) * ratio;
  }

  private createCounters(): void {
    const rightX = SCREEN_WIDTH - 140;
    const startY = 12;

    // Rupees
    const rupeeIcon = this.add.sprite(rightX, startY + 6, 'item_rupee');
    rupeeIcon.setScale(SCALE / 4);
    this.rupeeText = this.add.text(rightX + 15, startY, '000', {
      fontSize: '16px',
      color: '#00ff00',
    });

    // Bombs
    this.bombText = this.add.text(rightX, startY + 22, 'Bombs: 00', {
      fontSize: '12px',
      color: '#ffffff',
    });

    // Arrows
    this.arrowText = this.add.text(rightX, startY + 36, 'Arrows: 00', {
      fontSize: '12px',
      color: '#ffffff',
    });

    // Keys
    const keyIcon = this.add.sprite(rightX + 70, startY + 6, 'item_key');
    keyIcon.setScale(SCALE / 4);
    this.keyText = this.add.text(rightX + 85, startY, 'x0', {
      fontSize: '14px',
      color: '#ffd700',
    });
  }

  private updateCounters(): void {
    this.rupeeText.setText(this.playerData.rupees.toString().padStart(3, '0'));
    this.bombText.setText(`Bombs: ${this.playerData.bombs.toString().padStart(2, '0')}`);
    this.arrowText.setText(`Arrows: ${this.playerData.arrows.toString().padStart(2, '0')}`);
    this.keyText.setText(`x${this.playerData.keys}`);
  }

  private createEquippedItemDisplay(): void {
    const centerX = SCREEN_WIDTH / 2;
    const y = 10;
    const size = 40;

    // Box
    this.equippedItemBox = this.add.rectangle(centerX, y + size / 2, size, size, Colors.DARK_BLUE);
    this.equippedItemBox.setStrokeStyle(2, Colors.WHITE);

    // Item name
    this.equippedItemText = this.add.text(centerX, y + size + 5, '', {
      fontSize: '10px',
      color: '#ffffff',
    });
    this.equippedItemText.setOrigin(0.5, 0);

    // Label
    const label = this.add.text(centerX, y + size + 18, '[K]', {
      fontSize: '10px',
      color: '#888888',
    });
    label.setOrigin(0.5, 0);
  }

  private updateEquippedItem(): void {
    const equipped = this.playerData.equippedItem;
    const displayName = equipped.replace('_', ' ').toUpperCase();
    this.equippedItemText.setText(displayName);
  }

  private createMinimap(): void {
    const x = SCREEN_WIDTH - 55;
    const y = 10;
    const size = 45;

    // Map background
    const mapBg = this.add.rectangle(x + size / 2, y + size / 2, size, size, 0x1a1a3a);
    mapBg.setStrokeStyle(1, Colors.WHITE);

    // Player dot
    const playerDot = this.add.circle(x + size / 2, y + size / 2, 3, Colors.GREEN);
  }

  private createControlsHint(): void {
    const hint = this.add.text(
      SCREEN_WIDTH / 2,
      HUD_HEIGHT - 8,
      'WASD:Move | J:Sword | K:Item | I:Inventory | ESC:Pause',
      {
        fontSize: '9px',
        color: '#666666',
      }
    );
    hint.setOrigin(0.5, 1);
  }

  private updateUI(playerData: PlayerData): void {
    this.playerData = playerData;
    this.updateHearts();
    this.updateMagicBar();
    this.updateCounters();
    this.updateEquippedItem();
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('playerDataUpdate', this.updateUI, this);
  }
}
