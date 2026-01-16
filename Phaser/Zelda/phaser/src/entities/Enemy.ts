// Enemy class - handles enemy AI, behaviors, and combat

import Phaser from 'phaser';
import {
  ENEMY_TYPES,
  EnemyStats,
  TILE_SIZE,
  SCALE,
  Direction,
  DIRECTION_VECTORS,
  PLAYER_SPEED,
} from '../config';
import { Player } from './Player';

type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'stunned' | 'dead';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyType: string;
  public health: number;
  public maxHealth: number;
  public damage: number;
  public moveSpeed: number;
  public behavior: string;

  private player: Player;
  private currentState: EnemyState = 'patrol';
  private facing: Direction = Direction.DOWN;
  private alert: boolean = false;
  private canSeePlayer: boolean = false;

  // Timers
  private lastActionTime: number = 0;
  private actionCooldown: number = 0;
  private stunTime: number = 0;
  private stunDuration: number = 500;

  // Attack
  private attackCooldown: number = 1000;
  private lastAttackTime: number = 0;
  private attackRange: number;

  // Shooting
  private canShoot: boolean;
  private shootCooldown: number = 2000;
  private lastShootTime: number = 0;

  // Knockback
  private knockbackVelocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  // Direction
  private moveDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  // Callbacks
  public onProjectile?: (x: number, y: number, direction: Direction, type: string) => void;
  public onDeath?: (enemy: Enemy) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string, player: Player) {
    super(scene, x, y, `enemy_${type}`, 0);

    this.enemyType = type;
    this.player = player;

    // Get stats from config
    const stats = ENEMY_TYPES[type] || ENEMY_TYPES['soldier_green'];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.damage = stats.damage;
    this.moveSpeed = stats.speed;  // Speed is already in pixels/sec
    this.behavior = stats.behavior;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE * 0.7, TILE_SIZE * 0.7);
    body.setOffset(TILE_SIZE * 0.15, TILE_SIZE * 0.3);

    // Scale
    this.setScale(SCALE);

    // Set properties based on type
    this.attackRange = TILE_SIZE * SCALE * 1.5;
    this.canShoot = type === 'octorok' || type === 'moblin';
    this.actionCooldown = Phaser.Math.Between(1000, 3000);

    // Play animation
    this.play(`enemy_${type}_walk`);
  }

  update(time: number, delta: number): void {
    if (this.currentState === 'dead') return;

    // Apply knockback
    this.applyKnockback(delta);

    // Update behavior based on state
    if (this.currentState === 'stunned') {
      if (time - this.stunTime >= this.stunDuration) {
        // Reset movement direction when recovering from stun
        this.moveDirection.set(0, 0);
        this.currentState = this.alert ? 'chase' : 'patrol';
      }
      return;
    }

    // Run behavior
    this.updateBehavior(time, delta);

    // Move based on direction
    this.move();
  }

  private updateBehavior(time: number, delta: number): void {
    switch (this.behavior) {
      case 'patrol':
        this.behaviorPatrol(time);
        break;
      case 'chase':
        this.behaviorChase(time);
        break;
      case 'shoot':
        this.behaviorShoot(time);
        break;
      case 'fly':
        this.behaviorFly(time);
        break;
      case 'charge':
        this.behaviorCharge(time);
        break;
      case 'jump':
        this.behaviorJump(time);
        break;
      case 'wander':
        this.behaviorWander(time);
        break;
      case 'awaken':
        this.behaviorAwaken(time);
        break;
      case 'electric':
        this.behaviorElectric(time);
        break;
      case 'throw':
        this.behaviorShoot(time); // Same as shoot for now
        break;
      default:
        this.behaviorPatrol(time);
    }

    // Shooting enemies also check for shooting
    if (this.canShoot) {
      this.tryShoot(time);
    }
  }

  private behaviorPatrol(time: number): void {
    if (!this.alert) {
      // Wander randomly
      if (time - this.lastActionTime >= this.actionCooldown) {
        this.lastActionTime = time;
        this.actionCooldown = Phaser.Math.Between(1000, 3000);

        this.moveDirection.x = Phaser.Math.Between(-1, 1);
        this.moveDirection.y = Phaser.Math.Between(-1, 1);

        this.updateFacing();
      }
    }

    // Check if player is visible
    if (this.checkLineOfSight()) {
      this.alert = true;
      this.currentState = 'chase';
    }
  }

  private behaviorChase(time: number): void {
    const distance = this.getPlayerDistance();
    const direction = this.getPlayerDirection();

    if (distance < this.attackRange) {
      this.currentState = 'attack';
      this.moveDirection.set(0, 0);
    } else if (distance > TILE_SIZE * SCALE * 12) {
      this.alert = false;
      this.currentState = 'patrol';
    } else {
      this.moveDirection.copy(direction);
      this.updateFacing();
    }
  }

  private behaviorShoot(time: number): void {
    // Shoot behavior combines patrol with shooting
    this.behaviorPatrol(time);
  }

  private behaviorFly(time: number): void {
    const distance = this.getPlayerDistance();
    const direction = this.getPlayerDirection();

    if (distance < TILE_SIZE * SCALE * 8) {
      // Fly towards player with randomness
      this.moveDirection.x = direction.x + Phaser.Math.FloatBetween(-0.3, 0.3);
      this.moveDirection.y = direction.y + Phaser.Math.FloatBetween(-0.3, 0.3);
      this.moveDirection.normalize();
    } else {
      this.behaviorPatrol(time);
    }
  }

  private behaviorCharge(time: number): void {
    const distance = this.getPlayerDistance();
    const diff = new Phaser.Math.Vector2(
      this.player.x - this.x,
      this.player.y - this.y
    );

    if (distance < TILE_SIZE * SCALE * 6) {
      // Check if roughly aligned
      if (Math.abs(diff.x) < TILE_SIZE * SCALE && Math.abs(diff.y) > TILE_SIZE * SCALE) {
        // Vertical charge
        this.moveDirection.set(0, diff.y > 0 ? 1 : -1);
        this.moveSpeed = PLAYER_SPEED * 1.5;
      } else if (Math.abs(diff.y) < TILE_SIZE * SCALE && Math.abs(diff.x) > TILE_SIZE * SCALE) {
        // Horizontal charge
        this.moveDirection.set(diff.x > 0 ? 1 : -1, 0);
        this.moveSpeed = PLAYER_SPEED * 1.5;
      } else {
        // Not aligned - reset speed and patrol
        this.moveSpeed = ENEMY_TYPES[this.enemyType].speed;
        this.behaviorPatrol(time);
      }
    } else {
      this.moveSpeed = ENEMY_TYPES[this.enemyType].speed;
      this.behaviorPatrol(time);
    }
  }

  private behaviorJump(time: number): void {
    if (time - this.lastActionTime >= this.actionCooldown) {
      this.lastActionTime = time;
      this.actionCooldown = Phaser.Math.Between(800, 1500);

      const distance = this.getPlayerDistance();
      const direction = this.getPlayerDirection();

      if (distance < TILE_SIZE * SCALE * 6) {
        // Jump towards player
        this.moveDirection.copy(direction).scale(3);
      } else {
        // Random jump
        this.moveDirection.set(
          Phaser.Math.FloatBetween(-2, 2),
          Phaser.Math.FloatBetween(-2, 2)
        );
      }
    } else {
      // Slow down between jumps
      this.moveDirection.scale(0.95);
    }
  }

  private behaviorWander(time: number): void {
    this.behaviorPatrol(time);
  }

  private behaviorAwaken(time: number): void {
    const distance = this.getPlayerDistance();

    if (!this.alert) {
      this.moveDirection.set(0, 0);
      if (distance < TILE_SIZE * SCALE * 2) {
        this.alert = true;
      }
    } else {
      this.behaviorChase(time);
    }
  }

  private behaviorElectric(time: number): void {
    this.behaviorPatrol(time);
    this.moveSpeed = 30;  // Slow electric movement
  }

  private tryShoot(time: number): void {
    const distance = this.getPlayerDistance();

    if (distance < TILE_SIZE * SCALE * 6 && time - this.lastShootTime >= this.shootCooldown) {
      this.lastShootTime = time;

      if (this.onProjectile) {
        const offset = DIRECTION_VECTORS[this.facing];
        this.onProjectile(
          this.x + offset.x * TILE_SIZE * SCALE,
          this.y + offset.y * TILE_SIZE * SCALE,
          this.facing,
          'rock'
        );
      }

      this.moveDirection.set(0, 0);
    }
  }

  private checkLineOfSight(): boolean {
    const distance = this.getPlayerDistance();

    if (distance < TILE_SIZE * SCALE * 8) {
      this.canSeePlayer = true;
      return true;
    }

    this.canSeePlayer = false;
    return false;
  }

  private getPlayerDistance(): number {
    return Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
  }

  private getPlayerDirection(): Phaser.Math.Vector2 {
    const direction = new Phaser.Math.Vector2(
      this.player.x - this.x,
      this.player.y - this.y
    );

    if (direction.length() > 0) {
      direction.normalize();
    }

    return direction;
  }

  private updateFacing(): void {
    if (Math.abs(this.moveDirection.x) > Math.abs(this.moveDirection.y)) {
      this.facing = this.moveDirection.x > 0 ? Direction.RIGHT : Direction.LEFT;
    } else if (this.moveDirection.y !== 0) {
      this.facing = this.moveDirection.y > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  private move(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.moveDirection.length() > 0) {
      const normalizedDir = this.moveDirection.clone();
      if (normalizedDir.length() > 1) {
        normalizedDir.normalize();
      }

      body.setVelocity(
        normalizedDir.x * this.moveSpeed + this.knockbackVelocity.x,
        normalizedDir.y * this.moveSpeed + this.knockbackVelocity.y
      );
    } else {
      body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
    }
  }

  private applyKnockback(delta: number): void {
    if (this.knockbackVelocity.length() > 0.5) {
      this.knockbackVelocity.scale(0.9);
    } else {
      this.knockbackVelocity.set(0, 0);
    }
  }

  public takeDamage(amount: number, sourceX: number, sourceY: number): void {
    this.health -= amount;

    // Knockback
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
    this.knockbackVelocity.set(
      Math.cos(angle) * 300,
      Math.sin(angle) * 300
    );

    // Stun
    this.stunTime = this.scene.time.now;
    this.currentState = 'stunned';

    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    // Check death
    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.currentState = 'dead';

    // Death animation/effect
    this.setTint(0xff0000);

    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.onDeath) {
          this.onDeath(this);
        }
        this.destroy();
      },
    });
  }

  public getHitbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - (TILE_SIZE * SCALE * 0.35),
      this.y - (TILE_SIZE * SCALE * 0.35),
      TILE_SIZE * SCALE * 0.7,
      TILE_SIZE * SCALE * 0.7
    );
  }
}
