// CombatSystem - handles all combat interactions

import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { TILE_SIZE, SCALE } from '../config';

export class CombatSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Phaser.Physics.Arcade.Group;
  private projectiles: Phaser.Physics.Arcade.Group;

  private currentAttackHitbox: Phaser.Geom.Rectangle | null = null;
  private attackDamage: number = 0;
  private attackedEnemies: Set<Enemy> = new Set();

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    projectiles: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.projectiles = projectiles;

    // Listen for bomb explosions
    scene.events.on('bombExplosion', this.handleBombExplosion, this);
  }

  update(time: number, delta: number): void {
    // Check attack collisions if attacking
    if (this.currentAttackHitbox) {
      this.checkAttackCollisions();
    }
  }

  public handlePlayerAttack(damage: number, isSpinAttack: boolean): void {
    this.attackDamage = damage;
    this.attackedEnemies.clear();

    // Get attack hitbox
    if (isSpinAttack) {
      this.currentAttackHitbox = this.player.getSpinAttackHitbox();
    } else {
      this.currentAttackHitbox = this.player.getAttackHitbox();
    }

    // Create visual attack effect
    this.createAttackEffect(isSpinAttack);

    // Clear hitbox after short duration
    this.scene.time.delayedCall(200, () => {
      this.currentAttackHitbox = null;
    });
  }

  private createAttackEffect(isSpinAttack: boolean): void {
    if (!this.currentAttackHitbox) return;

    const hitbox = this.currentAttackHitbox;

    // Create a simple attack visual
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xaaddff, 0.5);
    graphics.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

    // Fade out
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        graphics.destroy();
      },
    });
  }

  private checkAttackCollisions(): void {
    if (!this.currentAttackHitbox) return;

    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as unknown as Enemy;

      // Skip if already hit this enemy in this attack
      if (this.attackedEnemies.has(enemy)) return;

      const enemyHitbox = enemy.getHitbox();

      if (Phaser.Geom.Rectangle.Overlaps(this.currentAttackHitbox!, enemyHitbox)) {
        enemy.takeDamage(this.attackDamage, this.player.x, this.player.y);
        this.attackedEnemies.add(enemy);
      }
    });
  }

  public handlePlayerEnemyCollision(enemy: Enemy): void {
    // Player takes damage from enemy contact
    if (!this.player.isInvincible) {
      this.player.takeDamage(enemy.damage, enemy.x, enemy.y);
    }
  }

  public handleProjectileHit(projectile: Projectile, enemy: Enemy): void {
    if (projectile.isPlayerProjectile) {
      enemy.takeDamage(projectile.damage, projectile.x, projectile.y);
      projectile.onHitEnemy();
    }
  }

  public handleEnemyProjectileHit(projectile: Projectile): void {
    if (!projectile.isPlayerProjectile && !this.player.isInvincible) {
      this.player.takeDamage(projectile.damage, projectile.x, projectile.y);
      projectile.onHitPlayer();
    }
  }

  private handleBombExplosion(x: number, y: number, damage: number): void {
    const explosionRadius = TILE_SIZE * SCALE * 2;

    // Damage enemies in range
    this.enemies.getChildren().forEach((gameObject) => {
      const enemy = gameObject as unknown as Enemy;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

      if (distance < explosionRadius) {
        enemy.takeDamage(damage, x, y);
      }
    });

    // Damage player if in range
    const playerDistance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (playerDistance < explosionRadius && !this.player.isInvincible) {
      this.player.takeDamage(damage / 2, x, y); // Half damage to player
    }

    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);
  }

  destroy(): void {
    this.scene.events.off('bombExplosion', this.handleBombExplosion, this);
  }
}
