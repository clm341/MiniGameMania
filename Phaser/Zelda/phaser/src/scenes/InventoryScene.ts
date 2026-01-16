// InventoryScene - Item selection screen

import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, Colors } from '../config';
import { PlayerData } from '../types';

export class InventoryScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private selectedIndex: number = 0;
  private itemSlots: { key: string; name: string }[] = [];
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private selectorBox!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'InventoryScene' });
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
      Colors.DARK_BLUE,
      0.9
    );

    // Title
    const title = this.add.text(SCREEN_WIDTH / 2, 50, 'INVENTORY', {
      fontSize: '32px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Build item list
    this.itemSlots = [
      { key: 'bombs', name: 'Bombs' },
      { key: 'bow', name: 'Bow' },
      { key: 'boomerang', name: 'Boomerang' },
      { key: 'hookshot', name: 'Hookshot' },
      { key: 'fire_rod', name: 'Fire Rod' },
      { key: 'ice_rod', name: 'Ice Rod' },
      { key: 'lamp', name: 'Lamp' },
      { key: 'hammer', name: 'Hammer' },
      { key: 'net', name: 'Net' },
      { key: 'cane_somaria', name: 'Cane of Somaria' },
      { key: 'cane_byrna', name: 'Cane of Byrna' },
      { key: 'cape', name: 'Magic Cape' },
    ];

    // Find current equipped index
    this.selectedIndex = this.itemSlots.findIndex(
      (item) => item.key === this.playerData.equippedItem
    );
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    // Create item grid
    this.createItemGrid();

    // Create selector
    this.updateSelector();

    // Input
    this.input.keyboard!.on('keydown-UP', this.moveUp, this);
    this.input.keyboard!.on('keydown-W', this.moveUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    this.input.keyboard!.on('keydown-S', this.moveDown, this);
    this.input.keyboard!.on('keydown-LEFT', this.moveLeft, this);
    this.input.keyboard!.on('keydown-A', this.moveLeft, this);
    this.input.keyboard!.on('keydown-RIGHT', this.moveRight, this);
    this.input.keyboard!.on('keydown-D', this.moveRight, this);
    this.input.keyboard!.on('keydown-ENTER', this.selectItem, this);
    this.input.keyboard!.on('keydown-Z', this.selectItem, this);
    this.input.keyboard!.on('keydown-I', this.close, this);
    this.input.keyboard!.on('keydown-ESC', this.close, this);

    // Equipment info
    this.createEquipmentInfo();

    // Controls hint
    const hint = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 40, 'Arrows: Navigate | Enter: Equip | I/ESC: Close', {
      fontSize: '14px',
      color: '#888888',
    });
    hint.setOrigin(0.5);
  }

  private createItemGrid(): void {
    const startX = 100;
    const startY = 120;
    const colWidth = 150;
    const rowHeight = 50;
    const cols = 4;

    this.itemTexts = [];

    this.itemSlots.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = startX + col * colWidth;
      const y = startY + row * rowHeight;

      // Check if player has item
      const hasItem = this.playerHasItem(item.key);
      const color = hasItem ? '#ffffff' : '#555555';

      const text = this.add.text(x, y, item.name, {
        fontSize: '16px',
        color: color,
      });

      // Mark equipped item
      if (item.key === this.playerData.equippedItem) {
        text.setColor('#ffd700');
      }

      this.itemTexts.push(text);
    });

    // Selector box
    this.selectorBox = this.add.rectangle(0, 0, 140, 40);
    this.selectorBox.setStrokeStyle(2, Colors.GOLD);
    this.selectorBox.setFillStyle(0x000000, 0);
  }

  private playerHasItem(key: string): boolean {
    const items = this.playerData.items as unknown as Record<string, unknown>;
    const value = items[key];

    if (typeof value === 'boolean') {
      return value;
    } else if (typeof value === 'string') {
      return value !== 'none';
    }

    return false;
  }

  private createEquipmentInfo(): void {
    // Sword
    const swordLabel = this.add.text(50, SCREEN_HEIGHT - 150, 'Sword:', {
      fontSize: '14px',
      color: '#ffffff',
    });
    const swordValue = this.add.text(120, SCREEN_HEIGHT - 150, this.playerData.items.sword.toUpperCase(), {
      fontSize: '14px',
      color: '#ffd700',
    });

    // Shield
    const shieldLabel = this.add.text(50, SCREEN_HEIGHT - 130, 'Shield:', {
      fontSize: '14px',
      color: '#ffffff',
    });
    const shieldValue = this.add.text(120, SCREEN_HEIGHT - 130, this.playerData.items.shield.toUpperCase(), {
      fontSize: '14px',
      color: '#ffd700',
    });

    // Armor
    const armorLabel = this.add.text(50, SCREEN_HEIGHT - 110, 'Armor:', {
      fontSize: '14px',
      color: '#ffffff',
    });
    const armorValue = this.add.text(120, SCREEN_HEIGHT - 110, this.playerData.items.armor.toUpperCase(), {
      fontSize: '14px',
      color: '#ffd700',
    });
  }

  private moveUp(): void {
    const cols = 4;
    if (this.selectedIndex >= cols) {
      this.selectedIndex -= cols;
      this.updateSelector();
    }
  }

  private moveDown(): void {
    const cols = 4;
    if (this.selectedIndex + cols < this.itemSlots.length) {
      this.selectedIndex += cols;
      this.updateSelector();
    }
  }

  private moveLeft(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelector();
    }
  }

  private moveRight(): void {
    if (this.selectedIndex < this.itemSlots.length - 1) {
      this.selectedIndex++;
      this.updateSelector();
    }
  }

  private updateSelector(): void {
    const text = this.itemTexts[this.selectedIndex];
    if (text) {
      this.selectorBox.setPosition(text.x + 65, text.y + 10);
    }
  }

  private selectItem(): void {
    const item = this.itemSlots[this.selectedIndex];

    if (this.playerHasItem(item.key)) {
      // Update equipped item
      this.playerData.equippedItem = item.key;

      // Update visual
      this.itemTexts.forEach((text, index) => {
        const hasItem = this.playerHasItem(this.itemSlots[index].key);
        if (this.itemSlots[index].key === item.key) {
          text.setColor('#ffd700');
        } else if (hasItem) {
          text.setColor('#ffffff');
        } else {
          text.setColor('#555555');
        }
      });
    }
  }

  private close(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
