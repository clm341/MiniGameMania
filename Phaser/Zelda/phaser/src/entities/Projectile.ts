// Projectile class - arrows, bombs, boomerang, etc.

import Phaser from 'phaser';
import {
  Direction,
  DIRECTION_VECTORS,
  TILE_SIZE,
  SCALE,
  ITEM_DAMAGE,
} from '../config';

interface ProjectileConfig {
  speed: number;
  damage: number;
  lifetime: number;
  textureKey: string;
}

const PROJECTILE_CONFIGS: Record<string, ProjectileConfig> = {
  arrow: { speed: 500, damage: 4, lifetime: 1500, textureKey: 'item_arrow' },
  bomb: { speed: 0, damage: 8, lifetime: 2000, textureKey: 'item_bomb' },  // Faster fuse
  boomerang: { speed: 400, damage: 0, lifetime: 1000, textureKey: 'projectile_boomerang' },
  hookshot: { speed: 600, damage: 2, lifetime: 400, textureKey: 'projectile_rock' },
  fire: { speed: 450, damage: 8, lifetime: 800, textureKey: 'projectile_fire' },
  ice: { speed: 450, damage: 8, lifetime: 800, textureKey: 'projectile_ice' },
  rock: { speed: 350, damage: 2, lifetime: 1500, textureKey: 'projectile_rock' },
};

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public projectileType: string;
  public damage: number;
  public isPlayerProjectile: boolean;

  private direction: Direction;
  private velocity: Phaser.Math.Vector2;
  private spawnTime: number;
  private lifetime: number;
  private returning: boolean = false;
  private startX: number;
  private startY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Direction,
    type: string,
    isPlayerProjectile: boolean
  ) {
    const config = PROJECTILE_CONFIGS[type] || PROJECTILE_CONFIGS['rock'];
    super(scene, x, y, config.textureKey);

    this.projectileType = type;
    this.direction = direction;
    this.damage = config.damage;
    this.lifetime = config.lifetime;
    this.isPlayerProjectile = isPlayerProjectile;
    this.startX = x;
    this.startY = y;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Scale
    this.setScale(SCALE * 0.5);

    // Set velocity
    const dirVec = DIRECTION_VECTORS[direction];
    this.velocity = new Phaser.Math.Vector2(
      dirVec.x * config.speed,
      dirVec.y * config.speed
    );

    // Apply velocity
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.velocity.x, this.velocity.y);

    // Record spawn time
    this.spawnTime = scene.time.now;

    // Rotate based on direction
    this.setRotation(this.getRotationFromDirection());

    // Special handling for bombs (stationary)
    if (type === 'bomb') {
      body.setVelocity(0, 0);
      this.startBombFuse();
    }
  }

  private getRotationFromDirection(): number {
    switch (this.direction) {
      case Direction.UP: return -Math.PI / 2;
      case Direction.DOWN: return Math.PI / 2;
      case Direction.LEFT: return Math.PI;
      case Direction.RIGHT: return 0;
    }
  }

  private startBombFuse(): void {
    // Flash before explosion - limit repeats to avoid memory leak
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(this.lifetime / 400), // Limited repeats based on lifetime
    });
  }

  update(time: number, delta: number): void {
    // Check lifetime
    if (time - this.spawnTime >= this.lifetime) {
      this.onExpire();
      return;
    }

    // Special handling for boomerang (returns to player)
    if (this.projectileType === 'boomerang') {
      this.updateBoomerang(time);
    }
  }

  private updateBoomerang(time: number): void {
    const elapsed = time - this.spawnTime;
    const halfLife = this.lifetime / 2;

    if (elapsed > halfLife && !this.returning) {
      this.returning = true;
    }

    if (this.returning) {
      // Return to origin
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.startX, this.startY);
      const speed = 300;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Check if returned
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);
      if (distance < 20) {
        this.destroy();
      }
    }

    // Spin the boomerang
    this.rotation += 0.3;
  }

  public onHitObstacle(): void {
    if (this.projectileType === 'bomb') {
      // Bombs don't get destroyed by obstacles
      return;
    }

    if (this.projectileType === 'boomerang') {
      // Boomerang bounces back
      this.returning = true;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(-this.velocity.x, -this.velocity.y);
      return;
    }

    this.destroy();
  }

  public onHitEnemy(): void {
    if (this.projectileType === 'boomerang') {
      // Boomerang stuns but doesn't get destroyed
      return;
    }

    if (this.projectileType === 'bomb') {
      // Bombs don't get triggered by enemies
      return;
    }

    this.destroy();
  }

  public onHitPlayer(): void {
    this.destroy();
  }

  private onExpire(): void {
    if (this.projectileType === 'bomb') {
      this.explode();
    } else {
      this.destroy();
    }
  }

  private explode(): void {
    // Create explosion effect
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
    explosion.setScale(SCALE);
    explosion.play('explosion');
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });

    // Emit explosion event for damage
    this.scene.events.emit('bombExplosion', this.x, this.y, this.damage);

    this.destroy();
  }
}
