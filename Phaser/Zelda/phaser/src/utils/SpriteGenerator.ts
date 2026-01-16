// Pixel Art Sprite Generator
// Generates 16x16 pixel art sprites programmatically using Canvas API

import { TILE_SIZE, SCALE, Colors } from '../config';

export class SpriteGenerator {
  private scene: Phaser.Scene;
  private size: number = TILE_SIZE;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Generate all game sprites
  generateAllSprites(): void {
    this.generatePlayerSprites();
    this.generateEnemySprites();
    this.generateTileSprites();
    this.generateItemSprites();
    this.generateUISprites();
    this.generateProjectileSprites();
    this.generateInteractableSprites();
    this.generateDropSprites();
    this.generateDungeonSprites();
  }

  // Create a canvas texture and return it
  private createTexture(key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Failed to get canvas context for texture: ${key}`);
      return;
    }
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    this.scene.textures.addCanvas(key, canvas);
  }

  // Create a spritesheet texture
  private createSpritesheet(key: string, frameWidth: number, frameHeight: number, frames: number, drawFn: (ctx: CanvasRenderingContext2D, frame: number) => void): void {
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * frames;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Failed to get canvas context for spritesheet: ${key}`);
      return;
    }
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frames; i++) {
      ctx.save();
      ctx.translate(i * frameWidth, 0);
      drawFn(ctx, i);
      ctx.restore();
    }

    // Add as canvas texture first, then create spritesheet from it
    const texture = this.scene.textures.addCanvas(key, canvas);
    if (texture) {
      texture.add('__BASE', 0, 0, 0, canvas.width, canvas.height);
      // Add frames manually
      for (let i = 0; i < frames; i++) {
        texture.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
      }
    }
  }

  // ==================== PLAYER SPRITES ====================

  generatePlayerSprites(): void {
    const size = this.size;
    const directions = ['down', 'up', 'left', 'right'];

    // Generate walk animations for each direction (4 frames each)
    directions.forEach((dir, dirIndex) => {
      this.createSpritesheet(`player_walk_${dir}`, size, size, 4, (ctx, frame) => {
        this.drawLink(ctx, size, dir, 'walk', frame);
      });
    });

    // Generate idle sprites for each direction
    directions.forEach((dir) => {
      this.createTexture(`player_idle_${dir}`, size, size, (ctx) => {
        this.drawLink(ctx, size, dir, 'idle', 0);
      });
    });

    // Generate attack sprites for each direction (3 frames each)
    directions.forEach((dir) => {
      this.createSpritesheet(`player_attack_${dir}`, size, size, 3, (ctx, frame) => {
        this.drawLink(ctx, size, dir, 'attack', frame);
      });
    });
  }

  private drawLink(ctx: CanvasRenderingContext2D, size: number, direction: string, action: string, frame: number): void {
    // Base colors
    const tunicGreen = '#22aa22';
    const tunicDark = '#118811';
    const skinTone = '#ffcc99';
    const hairBrown = '#885522';
    const hatGreen = '#33bb33';

    // Body base
    ctx.fillStyle = tunicGreen;
    ctx.fillRect(4, 6, 8, 7);

    // Tunic details
    ctx.fillStyle = tunicDark;
    ctx.fillRect(4, 11, 8, 2);

    // Head
    ctx.fillStyle = skinTone;
    ctx.fillRect(5, 2, 6, 5);

    // Hair/Hat based on direction
    ctx.fillStyle = hatGreen;
    if (direction === 'down') {
      ctx.fillRect(4, 1, 8, 3);
      ctx.fillStyle = hairBrown;
      ctx.fillRect(5, 3, 6, 1);
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(6, 4, 1, 1);
      ctx.fillRect(9, 4, 1, 1);
    } else if (direction === 'up') {
      ctx.fillRect(4, 1, 8, 4);
      ctx.fillStyle = hairBrown;
      ctx.fillRect(5, 2, 6, 3);
    } else if (direction === 'left') {
      ctx.fillRect(3, 1, 7, 3);
      ctx.fillRect(2, 2, 2, 4); // Hat point
      ctx.fillStyle = hairBrown;
      ctx.fillRect(5, 3, 4, 2);
      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(5, 4, 1, 1);
    } else { // right
      ctx.fillRect(6, 1, 7, 3);
      ctx.fillRect(12, 2, 2, 4); // Hat point
      ctx.fillStyle = hairBrown;
      ctx.fillRect(7, 3, 4, 2);
      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, 4, 1, 1);
    }

    // Legs with animation
    ctx.fillStyle = '#884411';
    const legOffset = action === 'walk' ? (frame % 2) * 2 : 0;
    ctx.fillRect(5, 13, 2, 3 - legOffset);
    ctx.fillRect(9, 13, 2, 3 - (1 - legOffset));

    // Arms
    ctx.fillStyle = skinTone;
    if (action === 'attack') {
      // Sword attack pose
      this.drawSwordAttack(ctx, size, direction, frame);
    } else {
      ctx.fillRect(2, 7, 2, 4);
      ctx.fillRect(12, 7, 2, 4);
    }
  }

  private drawSwordAttack(ctx: CanvasRenderingContext2D, size: number, direction: string, frame: number): void {
    const swordColor = '#cccccc';
    const hiltColor = '#8B4513';

    ctx.fillStyle = swordColor;

    // Swing animation based on frame and direction
    const swingAngle = (frame - 1) * 45; // -45, 0, 45 degrees

    if (direction === 'down') {
      ctx.fillRect(10 + (frame - 1) * 2, 10, 2, 8);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(9 + (frame - 1) * 2, 9, 4, 2);
    } else if (direction === 'up') {
      ctx.fillRect(4 + (frame - 1) * 2, -2, 2, 8);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(3 + (frame - 1) * 2, 5, 4, 2);
    } else if (direction === 'left') {
      ctx.fillRect(-4, 6 + (frame - 1) * 2, 8, 2);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(3, 5 + (frame - 1) * 2, 2, 4);
    } else { // right
      ctx.fillRect(12, 6 + (frame - 1) * 2, 8, 2);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(11, 5 + (frame - 1) * 2, 2, 4);
    }
  }

  // ==================== ENEMY SPRITES ====================

  generateEnemySprites(): void {
    const size = this.size;

    // Soldier (green)
    this.createSpritesheet('enemy_soldier_green', size, size, 2, (ctx, frame) => {
      this.drawSoldier(ctx, size, '#228822', frame);
    });

    // Soldier (blue)
    this.createSpritesheet('enemy_soldier_blue', size, size, 2, (ctx, frame) => {
      this.drawSoldier(ctx, size, '#2222aa', frame);
    });

    // Octorok
    this.createSpritesheet('enemy_octorok', size, size, 2, (ctx, frame) => {
      this.drawOctorok(ctx, size, frame);
    });

    // Keese (bat)
    this.createSpritesheet('enemy_keese', size, size, 2, (ctx, frame) => {
      this.drawKeese(ctx, size, frame);
    });

    // Stalfos (skeleton)
    this.createSpritesheet('enemy_stalfos', size, size, 2, (ctx, frame) => {
      this.drawStalfos(ctx, size, frame);
    });

    // Moblin
    this.createSpritesheet('enemy_moblin', size, size, 2, (ctx, frame) => {
      this.drawMoblin(ctx, size, frame);
    });
  }

  private drawSoldier(ctx: CanvasRenderingContext2D, size: number, color: string, frame: number): void {
    // Helmet
    ctx.fillStyle = color;
    ctx.fillRect(3, 1, 10, 6);

    // Armor body
    ctx.fillRect(4, 7, 8, 6);

    // Visor
    ctx.fillStyle = '#333333';
    ctx.fillRect(5, 4, 6, 2);

    // Legs
    ctx.fillStyle = '#666666';
    const legOffset = frame % 2;
    ctx.fillRect(5, 13, 2, 3 - legOffset);
    ctx.fillRect(9, 13, 2, 3 - (1 - legOffset));

    // Spear
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(13, 2, 2, 12);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(13, 0, 2, 3);
  }

  private drawOctorok(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    // Body
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Darker spots
    ctx.fillStyle = '#cc4444';
    ctx.fillRect(4, 5, 2, 2);
    ctx.fillRect(10, 5, 2, 2);
    ctx.fillRect(7, 10, 2, 2);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 6, 2, 2);
    ctx.fillRect(9, 6, 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 7, 1, 1);
    ctx.fillRect(10, 7, 1, 1);

    // Mouth/tube
    ctx.fillStyle = '#000000';
    const mouthOpen = frame % 2 === 0;
    ctx.fillRect(7, 11, 2, mouthOpen ? 3 : 2);
  }

  private drawKeese(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    // Body
    ctx.fillStyle = '#333333';
    ctx.fillRect(6, 6, 4, 4);

    // Wings
    ctx.fillStyle = '#222222';
    const wingUp = frame % 2 === 0;
    if (wingUp) {
      ctx.fillRect(1, 4, 5, 3);
      ctx.fillRect(10, 4, 5, 3);
    } else {
      ctx.fillRect(1, 8, 5, 3);
      ctx.fillRect(10, 8, 5, 3);
    }

    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(6, 7, 1, 1);
    ctx.fillRect(9, 7, 1, 1);
  }

  private drawStalfos(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    // Skull
    ctx.fillStyle = '#eeeecc';
    ctx.fillRect(4, 1, 8, 6);

    // Eye sockets
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, 3, 2, 2);
    ctx.fillRect(9, 3, 2, 2);

    // Jaw
    ctx.fillRect(5, 6, 6, 1);

    // Spine/ribs
    ctx.fillStyle = '#ddddbb';
    ctx.fillRect(7, 7, 2, 4);
    ctx.fillRect(5, 8, 6, 1);
    ctx.fillRect(5, 10, 6, 1);

    // Legs
    const legOffset = frame % 2;
    ctx.fillRect(5, 12, 2, 4 - legOffset);
    ctx.fillRect(9, 12, 2, 4 - (1 - legOffset));

    // Arms
    ctx.fillRect(2, 7, 3, 2);
    ctx.fillRect(11, 7, 3, 2);
  }

  private drawMoblin(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    // Body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4, 5, 8, 8);

    // Head (pig-like)
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(3, 0, 10, 6);

    // Snout
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(5, 3, 6, 3);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(4, 2, 2, 2);
    ctx.fillRect(10, 2, 2, 2);

    // Nostrils
    ctx.fillRect(6, 4, 1, 1);
    ctx.fillRect(9, 4, 1, 1);

    // Ears
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(1, 0, 3, 3);
    ctx.fillRect(12, 0, 3, 3);

    // Legs
    ctx.fillStyle = '#8B4513';
    const legOffset = frame % 2;
    ctx.fillRect(5, 13, 2, 3 - legOffset);
    ctx.fillRect(9, 13, 2, 3 - (1 - legOffset));
  }

  // ==================== TILE SPRITES ====================

  generateTileSprites(): void {
    const size = this.size;

    // Grass
    this.createTexture('tile_grass', size, size, (ctx) => {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 0, size, size);
      // Add texture
      ctx.fillStyle = '#2d9d2d';
      for (let i = 0; i < size; i += 4) {
        for (let j = 0; j < size; j += 4) {
          if ((i + j) % 8 === 0) {
            ctx.fillRect(i, j, 2, 2);
          }
        }
      }
    });

    // Wall/Stone
    this.createTexture('tile_wall', size, size, (ctx) => {
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#555555';
      ctx.fillRect(1, 1, size - 2, size - 2);
      ctx.fillStyle = '#777777';
      ctx.fillRect(2, 2, size - 4, 2);
      ctx.fillRect(2, 2, 2, size - 4);
    });

    // Water
    this.createTexture('tile_water', size, size, (ctx) => {
      ctx.fillStyle = '#4444cc';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#6666dd';
      ctx.fillRect(0, 6, size, 2);
      ctx.fillRect(4, 12, size - 4, 2);
    });

    // Tree
    this.createTexture('tile_tree', size, size, (ctx) => {
      // Trunk
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(6, 10, 4, 6);
      // Leaves
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(8, 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a7a1a';
      ctx.beginPath();
      ctx.arc(6, 5, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rock
    this.createTexture('tile_rock', size, size, (ctx) => {
      ctx.fillStyle = '#228B22'; // grass background
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.arc(6, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Path
    this.createTexture('tile_path', size, size, (ctx) => {
      ctx.fillStyle = '#C4A86B';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#B8986B';
      ctx.fillRect(2, 2, 3, 3);
      ctx.fillRect(10, 8, 4, 4);
      ctx.fillRect(4, 12, 3, 2);
    });

    // Bush
    this.createTexture('tile_bush', size, size, (ctx) => {
      ctx.fillStyle = '#228B22'; // grass background
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(5, 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(11, 7, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ==================== ITEM SPRITES ====================

  generateItemSprites(): void {
    const size = this.size;

    // Heart (full)
    this.createTexture('item_heart_full', size, size, (ctx) => {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.arc(11, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1, 6);
      ctx.lineTo(8, 15);
      ctx.lineTo(15, 6);
      ctx.fill();
    });

    // Rupee (green)
    this.createTexture('item_rupee', size, size, (ctx) => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(8, 1);
      ctx.lineTo(13, 5);
      ctx.lineTo(13, 11);
      ctx.lineTo(8, 15);
      ctx.lineTo(3, 11);
      ctx.lineTo(3, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#88ff88';
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(5, 5);
      ctx.lineTo(5, 11);
      ctx.lineTo(8, 14);
      ctx.closePath();
      ctx.fill();
    });

    // Bomb
    this.createTexture('item_bomb', size, size, (ctx) => {
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(8, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      // Fuse
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(7, 2, 2, 4);
      // Spark
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(6, 0, 4, 3);
    });

    // Arrow
    this.createTexture('item_arrow', size, size, (ctx) => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(3, 7, 10, 2);
      ctx.fillStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(13, 8);
      ctx.lineTo(16, 5);
      ctx.lineTo(16, 11);
      ctx.closePath();
      ctx.fill();
      // Fletching
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 6, 3, 1);
      ctx.fillRect(0, 9, 3, 1);
    });

    // Key
    this.createTexture('item_key', size, size, (ctx) => {
      ctx.fillStyle = '#ffd700';
      // Handle
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.fill();
      // Shaft
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(8, 4, 6, 2);
      // Teeth
      ctx.fillRect(12, 6, 2, 3);
      ctx.fillRect(10, 6, 2, 2);
    });
  }

  // ==================== UI SPRITES ====================

  generateUISprites(): void {
    const size = this.size;

    // Heart (half)
    this.createTexture('ui_heart_half', size, size, (ctx) => {
      // Empty side
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(11, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(8, 15);
      ctx.lineTo(15, 6);
      ctx.fill();
      // Full side
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1, 6);
      ctx.lineTo(8, 15);
      ctx.lineTo(8, 6);
      ctx.fill();
    });

    // Heart (empty)
    this.createTexture('ui_heart_empty', size, size, (ctx) => {
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.arc(11, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1, 6);
      ctx.lineTo(8, 15);
      ctx.lineTo(15, 6);
      ctx.fill();
    });

    // Selector arrow
    this.createTexture('ui_arrow', size, size, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(12, 8);
      ctx.lineTo(4, 14);
      ctx.closePath();
      ctx.fill();
    });
  }

  // ==================== PROJECTILE SPRITES ====================

  generateProjectileSprites(): void {
    const size = this.size;

    // Sword slash effect
    this.createTexture('projectile_sword', size * 2, size, (ctx) => {
      ctx.fillStyle = '#aaddff';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(16, 8, 14, -0.5, 0.5);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fill();
    });

    // Rock projectile (for Octorok)
    this.createTexture('projectile_rock', 8, 8, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(2, 2, 2, 2);
    });

    // Boomerang
    this.createTexture('projectile_boomerang', size, size, (ctx) => {
      ctx.fillStyle = '#4444ff';
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(14, 8);
      ctx.lineTo(8, 8);
      ctx.lineTo(8, 14);
      ctx.lineTo(2, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();
    });

    // Fire (for fire rod)
    this.createTexture('projectile_fire', size, size, (ctx) => {
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(8, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(8, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(10, 6);
      ctx.lineTo(6, 6);
      ctx.closePath();
      ctx.fill();
    });

    // Ice (for ice rod)
    this.createTexture('projectile_ice', size, size, (ctx) => {
      ctx.fillStyle = '#4488ff';
      ctx.beginPath();
      ctx.arc(8, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#88ccff';
      ctx.beginPath();
      ctx.arc(8, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(10, 6);
      ctx.lineTo(6, 6);
      ctx.closePath();
      ctx.fill();
    });

    // Explosion
    this.createSpritesheet('explosion', size * 2, size * 2, 4, (ctx, frame) => {
      const radius = 8 + frame * 4;
      const alpha = 1 - frame * 0.2;
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(16, 16, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(16, 16, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(16, 16, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ==================== INTERACTABLE SPRITES ====================

  generateInteractableSprites(): void {
    const size = this.size;

    // Cuttable grass (different from tile grass - taller, more visible)
    this.createTexture('interactable_grass', size, size, (ctx) => {
      // Base grass
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 8, size, 8);

      // Grass blades
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(2, 4, 2, 12);
      ctx.fillRect(6, 2, 2, 14);
      ctx.fillRect(10, 5, 2, 11);
      ctx.fillRect(13, 3, 2, 13);

      // Tips
      ctx.fillStyle = '#3de03d';
      ctx.fillRect(2, 3, 2, 2);
      ctx.fillRect(6, 1, 2, 2);
      ctx.fillRect(10, 4, 2, 2);
      ctx.fillRect(13, 2, 2, 2);
    });

    // Bush (cuttable)
    this.createTexture('interactable_bush', size, size, (ctx) => {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 0, size, size); // Background

      ctx.fillStyle = '#1a7a1a';
      ctx.beginPath();
      ctx.arc(8, 10, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(5, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(11, 8, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(8, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pot (liftable)
    this.createTexture('interactable_pot', size, size, (ctx) => {
      // Pot body
      ctx.fillStyle = '#B87333';
      ctx.fillRect(3, 6, 10, 10);

      // Pot rim
      ctx.fillStyle = '#CD853F';
      ctx.fillRect(2, 4, 12, 3);

      // Pot highlights
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(4, 7, 3, 6);

      // Pot shadow
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(10, 7, 2, 8);
    });

    // Rock (liftable with glove)
    this.createTexture('interactable_rock', size, size, (ctx) => {
      ctx.fillStyle = '#228B22'; // grass background
      ctx.fillRect(0, 0, size, size);

      // Rock body
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.arc(8, 9, 7, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#909090';
      ctx.beginPath();
      ctx.arc(5, 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = '#404040';
      ctx.beginPath();
      ctx.arc(10, 12, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Treasure chest (closed)
    this.createTexture('interactable_chest', size, size, (ctx) => {
      // Chest body
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2, 6, 12, 8);

      // Lid
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(1, 3, 14, 4);
      ctx.fillRect(2, 2, 12, 2);

      // Gold trim
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(2, 6, 12, 1);
      ctx.fillRect(6, 7, 4, 4);

      // Lock
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(7, 8, 2, 2);
    });

    // Treasure chest (open)
    this.createTexture('interactable_chest_open', size, size, (ctx) => {
      // Chest body
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2, 8, 12, 6);

      // Inside (dark)
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(3, 6, 10, 3);

      // Open lid (tilted back)
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(2, 0, 12, 4);
      ctx.fillRect(1, 3, 14, 2);

      // Gold trim
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(2, 8, 12, 1);
    });

    // Sign post
    this.createTexture('interactable_sign', size, size, (ctx) => {
      // Post
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(7, 8, 2, 8);

      // Sign board
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(2, 2, 12, 7);

      // Border
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2, 2, 12, 1);
      ctx.fillRect(2, 8, 12, 1);
      ctx.fillRect(2, 2, 1, 7);
      ctx.fillRect(13, 2, 1, 7);
    });

    // Floor switch
    this.createTexture('interactable_switch', size, size, (ctx) => {
      // Floor
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, size, size);

      // Switch base
      ctx.fillStyle = '#888888';
      ctx.fillRect(3, 3, 10, 10);

      // Button (raised)
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(4, 4, 8, 8);

      // Highlight
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(4, 4, 8, 2);
      ctx.fillRect(4, 4, 2, 8);
    });

    // Floor switch (pressed)
    this.createTexture('interactable_switch_on', size, size, (ctx) => {
      // Floor
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, size, size);

      // Switch base
      ctx.fillStyle = '#888888';
      ctx.fillRect(3, 3, 10, 10);

      // Button (pressed - darker, less raised)
      ctx.fillStyle = '#666666';
      ctx.fillRect(4, 5, 8, 7);
    });

    // Pressure plate
    this.createTexture('interactable_pressure_plate', size, size, (ctx) => {
      // Floor
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, size, size);

      // Plate
      ctx.fillStyle = '#999999';
      ctx.fillRect(2, 2, 12, 12);

      // Inner edge
      ctx.fillStyle = '#777777';
      ctx.fillRect(3, 3, 10, 10);
    });

    // Pressure plate (pressed)
    this.createTexture('interactable_pressure_plate_down', size, size, (ctx) => {
      // Floor
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, size, size);

      // Plate (recessed)
      ctx.fillStyle = '#666666';
      ctx.fillRect(2, 3, 12, 11);

      // Inner shadow
      ctx.fillStyle = '#444444';
      ctx.fillRect(2, 3, 12, 2);
    });

    // Locked door
    this.createTexture('interactable_door_locked', size, size * 2, (ctx) => {
      // Door frame
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, size, size * 2);

      // Door
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2, 2, 12, 28);

      // Lock
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(6, 12, 4, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(7, 14, 2, 2);

      // Metal bands
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(2, 4, 12, 2);
      ctx.fillRect(2, 24, 12, 2);
    });

    // Boss door
    this.createTexture('interactable_door_boss', size, size * 2, (ctx) => {
      // Door frame
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, size, size * 2);

      // Door
      ctx.fillStyle = '#4a0000';
      ctx.fillRect(2, 2, 12, 28);

      // Skull decoration
      ctx.fillStyle = '#eeeecc';
      ctx.fillRect(5, 8, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(6, 10, 1, 2);
      ctx.fillRect(9, 10, 1, 2);
      ctx.fillRect(7, 12, 2, 1);

      // Big lock
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(5, 18, 6, 8);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(6, 20, 4, 4);
    });
  }

  // ==================== DROP SPRITES ====================

  generateDropSprites(): void {
    const size = this.size;

    // Green rupee
    this.createTexture('item_rupee_green', size, size, (ctx) => {
      this.drawRupee(ctx, '#00ff00', '#88ff88');
    });

    // Blue rupee
    this.createTexture('item_rupee_blue', size, size, (ctx) => {
      this.drawRupee(ctx, '#0088ff', '#88ccff');
    });

    // Red rupee
    this.createTexture('item_rupee_red', size, size, (ctx) => {
      this.drawRupee(ctx, '#ff0000', '#ff8888');
    });

    // Small magic jar
    this.createTexture('item_magic_small', size, size, (ctx) => {
      // Jar
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(5, 6, 6, 8);
      ctx.fillRect(4, 8, 8, 4);

      // Neck
      ctx.fillStyle = '#008800';
      ctx.fillRect(6, 4, 4, 3);

      // Sparkle
      ctx.fillStyle = '#88ff88';
      ctx.fillRect(6, 8, 2, 2);
    });

    // Large magic jar
    this.createTexture('item_magic_large', size, size, (ctx) => {
      // Jar
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(3, 4, 10, 10);
      ctx.fillRect(2, 6, 12, 6);

      // Neck
      ctx.fillStyle = '#008800';
      ctx.fillRect(5, 2, 6, 3);

      // Sparkle
      ctx.fillStyle = '#88ff88';
      ctx.fillRect(5, 6, 3, 3);
    });

    // Arrow pickup
    this.createTexture('item_arrow_pickup', size, size, (ctx) => {
      // Shaft
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(4, 7, 8, 2);

      // Head
      ctx.fillStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(12, 8);
      ctx.lineTo(15, 5);
      ctx.lineTo(15, 11);
      ctx.closePath();
      ctx.fill();

      // Fletching
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(2, 6, 2, 1);
      ctx.fillRect(2, 9, 2, 1);
    });

    // Heart piece
    this.createTexture('item_heart_piece', size, size, (ctx) => {
      // Heart shape (partial)
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(6, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, 6);
      ctx.lineTo(8, 14);
      ctx.lineTo(8, 6);
      ctx.fill();

      // Sparkle
      ctx.fillStyle = '#ffaaaa';
      ctx.fillRect(4, 4, 2, 2);
    });

    // Boss key
    this.createTexture('item_boss_key', size, size, (ctx) => {
      // Handle (skull shaped)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Skull details
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, 4, 1, 2);
      ctx.fillRect(6, 4, 1, 2);

      // Shaft
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(8, 4, 7, 2);

      // Teeth (larger)
      ctx.fillRect(12, 6, 3, 4);
      ctx.fillRect(10, 6, 2, 3);
    });

    // Dungeon map
    this.createTexture('item_map', size, size, (ctx) => {
      // Paper
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(2, 2, 12, 12);

      // Map lines
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(4, 4, 8, 1);
      ctx.fillRect(4, 6, 6, 1);
      ctx.fillRect(4, 8, 8, 1);
      ctx.fillRect(4, 10, 4, 1);
    });

    // Compass
    this.createTexture('item_compass', size, size, (ctx) => {
      // Body
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Inner
      ctx.fillStyle = '#FFFACD';
      ctx.beginPath();
      ctx.arc(8, 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Needle
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(10, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(6, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();
    });

    // Fairy
    this.createSpritesheet('item_fairy', size, size, 2, (ctx, frame) => {
      // Body glow
      ctx.fillStyle = frame === 0 ? '#ffaaff' : '#ffccff';
      ctx.beginPath();
      ctx.arc(8, 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.7;
      const wingY = frame === 0 ? 6 : 8;
      ctx.fillRect(2, wingY, 4, 3);
      ctx.fillRect(10, wingY, 4, 3);
      ctx.globalAlpha = 1;

      // Body
      ctx.fillStyle = '#ff88ff';
      ctx.fillRect(7, 6, 2, 4);
    });
  }

  private drawRupee(ctx: CanvasRenderingContext2D, mainColor: string, highlightColor: string): void {
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(13, 5);
    ctx.lineTo(13, 11);
    ctx.lineTo(8, 15);
    ctx.lineTo(3, 11);
    ctx.lineTo(3, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(5, 5);
    ctx.lineTo(5, 11);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();
  }

  // ==================== DUNGEON SPRITES ====================

  generateDungeonSprites(): void {
    const size = this.size;

    // Pit/hole
    this.createTexture('tile_pit', size, size, (ctx) => {
      // Dark pit
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(8, 8, 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner shadow
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(8, 7, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dungeon floor
    this.createTexture('tile_dungeon_floor', size, size, (ctx) => {
      ctx.fillStyle = '#444444';
      ctx.fillRect(0, 0, size, size);

      // Grid pattern
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, size, 1);
      ctx.fillRect(0, 0, 1, size);

      ctx.fillStyle = '#555555';
      ctx.fillRect(size - 1, 0, 1, size);
      ctx.fillRect(0, size - 1, size, 1);
    });

    // Dungeon wall
    this.createTexture('tile_dungeon_wall', size, size, (ctx) => {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, size, size);

      // Brick pattern
      ctx.fillStyle = '#444444';
      ctx.fillRect(1, 1, 7, 7);
      ctx.fillRect(9, 1, 6, 7);
      ctx.fillRect(1, 9, 6, 6);
      ctx.fillRect(8, 9, 7, 6);

      // Mortar lines
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 8, size, 1);
      ctx.fillRect(8, 0, 1, 8);
      ctx.fillRect(7, 8, 1, 8);
    });

    // Torch (for lamp illumination reference)
    this.createSpritesheet('tile_torch', size, size, 2, (ctx, frame) => {
      // Holder
      ctx.fillStyle = '#666666';
      ctx.fillRect(6, 8, 4, 8);

      // Flame
      const flameHeight = frame === 0 ? 6 : 5;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(8, 8 - flameHeight);
      ctx.lineTo(11, 8);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(8, 8 - flameHeight + 2);
      ctx.lineTo(10, 8);
      ctx.lineTo(6, 8);
      ctx.closePath();
      ctx.fill();
    });

    // Cracked floor (for hammer)
    this.createTexture('tile_cracked_floor', size, size, (ctx) => {
      ctx.fillStyle = '#444444';
      ctx.fillRect(0, 0, size, size);

      // Cracks
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(8, 8);
      ctx.lineTo(12, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 10);
      ctx.lineTo(8, 8);
      ctx.lineTo(10, 14);
      ctx.stroke();
    });

    // Block (pushable)
    this.createTexture('interactable_block', size, size, (ctx) => {
      // Main block
      ctx.fillStyle = '#666666';
      ctx.fillRect(1, 1, 14, 14);

      // Top face (lighter)
      ctx.fillStyle = '#888888';
      ctx.fillRect(2, 2, 12, 4);

      // Shadow
      ctx.fillStyle = '#444444';
      ctx.fillRect(2, 12, 12, 2);
      ctx.fillRect(12, 2, 2, 12);
    });
  }
}
