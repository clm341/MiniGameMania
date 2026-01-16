// ItemDrop - Collectible items that drop from enemies, grass, pots, etc.

import Phaser from 'phaser';
import { TILE_SIZE, SCALE } from '../config';

export type DropType =
  | 'heart'
  | 'heart_piece'
  | 'rupee_green'
  | 'rupee_blue'
  | 'rupee_red'
  | 'bomb'
  | 'arrow'
  | 'arrow_10'
  | 'magic_jar_small'
  | 'magic_jar_large'
  | 'key'
  | 'boss_key'
  | 'map'
  | 'compass'
  | 'fairy';

interface DropData {
  texture: string;
  value: number;
  type: 'health' | 'rupees' | 'bombs' | 'arrows' | 'magic' | 'key' | 'boss_key' | 'map' | 'compass' | 'fairy' | 'heart_piece';
  floats?: boolean;
  sparkle?: boolean;
}

const DROP_DATA: Record<DropType, DropData> = {
  heart: { texture: 'item_heart_full', value: 2, type: 'health' },
  heart_piece: { texture: 'item_heart_piece', value: 1, type: 'heart_piece', sparkle: true },
  rupee_green: { texture: 'item_rupee_green', value: 1, type: 'rupees' },
  rupee_blue: { texture: 'item_rupee_blue', value: 5, type: 'rupees' },
  rupee_red: { texture: 'item_rupee_red', value: 20, type: 'rupees' },
  bomb: { texture: 'item_bomb', value: 1, type: 'bombs' },
  arrow: { texture: 'item_arrow_pickup', value: 1, type: 'arrows' },
  arrow_10: { texture: 'item_arrow_pickup', value: 10, type: 'arrows' },
  magic_jar_small: { texture: 'item_magic_small', value: 8, type: 'magic' },
  magic_jar_large: { texture: 'item_magic_large', value: 32, type: 'magic' },
  key: { texture: 'item_key', value: 1, type: 'key', sparkle: true },
  boss_key: { texture: 'item_boss_key', value: 1, type: 'boss_key', sparkle: true },
  map: { texture: 'item_map', value: 1, type: 'map', sparkle: true },
  compass: { texture: 'item_compass', value: 1, type: 'compass', sparkle: true },
  fairy: { texture: 'item_fairy', value: 8, type: 'fairy', floats: true, sparkle: true },
};

export class ItemDrop extends Phaser.Physics.Arcade.Sprite {
  public dropType: DropType;
  public dropData: DropData;

  private spawnTime: number;
  private lifetime: number = 8000; // 8 seconds to collect
  private floatOffset: number = 0;
  private sparkleTimer: number = 0;
  private collected: boolean = false;

  // For bounce animation on spawn
  private isBouncing: boolean = true;
  private bounceVelocity: number = -150;
  private gravity: number = 400;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dropType: DropType
  ) {
    const data = DROP_DATA[dropType];
    super(scene, x, y, data.texture);

    this.dropType = dropType;
    this.dropData = data;
    this.spawnTime = scene.time.now;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Scale sprite
    this.setScale(SCALE * 0.75);

    // Set up physics body for collection
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);

    // Initial bounce velocity
    body.setVelocityY(this.bounceVelocity);

    // Add some horizontal spread
    body.setVelocityX(Phaser.Math.Between(-50, 50));

    // Set depth
    this.setDepth(y + 100);

    // Sparkle effect for special items
    if (data.sparkle) {
      this.createSparkleEffect();
    }
  }

  private createSparkleEffect(): void {
    // Periodic sparkle
    this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (this.active && !this.collected) {
          const sparkle = this.scene.add.circle(
            this.x + Phaser.Math.Between(-8, 8),
            this.y + Phaser.Math.Between(-8, 8),
            2, 0xffffff
          );
          sparkle.setDepth(this.depth + 1);

          this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => sparkle.destroy()
          });
        }
      }
    });
  }

  update(time: number, delta: number): void {
    if (this.collected) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Bounce animation on spawn
    if (this.isBouncing) {
      body.velocity.y += this.gravity * (delta / 1000);

      // Stop bouncing when it hits "ground" (original Y position)
      if (body.velocity.y > 0 && this.y >= this.getData('spawnY') || body.velocity.y > 100) {
        this.isBouncing = false;
        body.setVelocity(0, 0);
        this.y = this.getData('spawnY') || this.y;
      }
    }

    // Floating animation for certain items
    if (!this.isBouncing && this.dropData.floats) {
      this.floatOffset += delta * 0.005;
      this.y += Math.sin(this.floatOffset) * 0.5;
    }

    // Check lifetime
    const elapsed = time - this.spawnTime;
    if (elapsed > this.lifetime - 2000) {
      // Flicker before disappearing
      const flickerRate = elapsed > this.lifetime - 1000 ? 50 : 100;
      if (Math.floor(elapsed / flickerRate) % 2 === 0) {
        this.setAlpha(0.3);
      } else {
        this.setAlpha(1);
      }
    }

    if (elapsed >= this.lifetime) {
      this.destroy();
    }

    // Y-sorting
    this.setDepth(this.y);
  }

  public collect(): { type: string; value: number } | null {
    if (this.collected) return null;

    this.collected = true;

    // Collection animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      alpha: 0,
      scale: this.scale * 1.5,
      duration: 200,
      onComplete: () => this.destroy()
    });

    return {
      type: this.dropData.type,
      value: this.dropData.value
    };
  }

  // Factory method to spawn drops with bounce
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dropType: DropType
  ): ItemDrop {
    const drop = new ItemDrop(scene, x, y, dropType);
    drop.setData('spawnY', y);
    return drop;
  }

  // Spawn from enemy death with random drop table
  static spawnFromEnemy(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): ItemDrop | null {
    // Enemy drop table
    const roll = Math.random();

    if (roll < 0.25) {
      return ItemDrop.spawn(scene, x, y, 'heart');
    } else if (roll < 0.35) {
      return ItemDrop.spawn(scene, x, y, 'rupee_green');
    } else if (roll < 0.40) {
      return ItemDrop.spawn(scene, x, y, 'rupee_blue');
    } else if (roll < 0.45) {
      return ItemDrop.spawn(scene, x, y, 'magic_jar_small');
    } else if (roll < 0.47) {
      return ItemDrop.spawn(scene, x, y, 'bomb');
    } else if (roll < 0.49) {
      return ItemDrop.spawn(scene, x, y, 'arrow');
    } else if (roll < 0.50) {
      return ItemDrop.spawn(scene, x, y, 'fairy');
    }

    return null;
  }
}
