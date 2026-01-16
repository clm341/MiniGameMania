// Player class - handles Link's movement, combat, and interactions

import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  SWORD_COOLDOWN,
  SWORD_DAMAGE,
  SPIN_ATTACK_CHARGE_TIME,
  SPIN_ATTACK_DAMAGE,
  INVINCIBILITY_DURATION,
  Direction,
  DIRECTION_VECTORS,
  TILE_SIZE,
  SCALE,
  ITEM_DAMAGE,
  ITEM_MAGIC_COST,
} from '../config';
import { PlayerData } from '../types';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerData: PlayerData;
  public health: number;
  public maxHealth: number;
  public magic: number;
  public maxMagic: number;
  public facing: Direction = Direction.DOWN;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private swordKey!: Phaser.Input.Keyboard.Key;
  private swordKey2!: Phaser.Input.Keyboard.Key;
  private itemKey!: Phaser.Input.Keyboard.Key;
  private itemKey2!: Phaser.Input.Keyboard.Key;

  private isAttacking: boolean = false;
  private attackCooldown: number = 0;
  private spinCharging: boolean = false;
  private spinChargeStart: number = 0;

  public isInvincible: boolean = false;
  private invincibleTimer: number = 0;
  private flickerTimer: number = 0;

  private canUseItem: boolean = true;
  private itemCooldown: number = 0;

  // Shield blocking
  public isBlocking: boolean = false;
  private shieldKey!: Phaser.Input.Keyboard.Key;

  // Pegasus boots dash
  public isDashing: boolean = false;
  private dashSpeed: number = 450;
  private dashDuration: number = 400;
  private dashCooldown: number = 0;
  private dashTimer: number = 0;

  // Lamp
  private lampActive: boolean = false;
  public lampRadius: number = 150;

  // Lifted object
  public isCarrying: boolean = false;
  public carriedObject: Phaser.GameObjects.Sprite | null = null;

  // Callbacks for combat system
  public onAttack?: (player: Player, damage: number, isSpinAttack: boolean) => void;
  public onProjectile?: (x: number, y: number, direction: Direction, type: string) => void;
  public onLampUse?: (x: number, y: number, radius: number) => void;
  public onHammerUse?: (x: number, y: number, direction: Direction) => void;
  public onShieldBlock?: (blocked: boolean) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, playerData: PlayerData) {
    super(scene, x, y, `player_idle_down`);

    this.playerData = playerData;
    this.health = playerData.health;
    this.maxHealth = playerData.maxHealth;
    this.magic = playerData.magic;
    this.maxMagic = playerData.maxMagic;
    this.facing = playerData.direction;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE * 0.7, TILE_SIZE * 0.7);
    body.setOffset(TILE_SIZE * 0.15, TILE_SIZE * 0.3);

    // Scale sprite
    this.setScale(SCALE);

    // Set up input
    this.setupInput();
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard!;

    this.cursors = keyboard.createCursorKeys();
    this.wasdKeys = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.swordKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.swordKey2 = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.itemKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.itemKey2 = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.shieldKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Quick item select (1-8)
    for (let i = 1; i <= 8; i++) {
      keyboard.addKey(48 + i).on('down', () => this.quickSelectItem(i));
    }
  }

  private quickSelectItem(slot: number): void {
    const items = ['bombs', 'bow', 'boomerang', 'hookshot', 'lamp', 'hammer', 'fire_rod', 'ice_rod'];
    if (slot <= items.length) {
      this.playerData.equippedItem = items[slot - 1];
    }
  }

  update(time: number, delta: number): void {
    if (this.isAttacking) {
      this.updateAttack(time, delta);
      return;
    }

    // Handle dashing
    if (this.isDashing) {
      this.updateDash(time, delta);
      return;
    }

    // Handle shield blocking
    this.handleShieldBlock();

    // Handle movement input (unless blocking)
    if (!this.isBlocking) {
      this.handleMovement();
    } else {
      // Stop when blocking
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Handle combat input
    this.handleCombat(time);

    // Handle item usage
    this.handleItems(time);

    // Update cooldowns
    this.updateCooldowns(delta);

    // Update invincibility
    this.updateInvincibility(time, delta);

    // Update carried object position
    this.updateCarriedObject();

    // Update animation
    this.updateAnimation();

    // Sync player data
    this.syncPlayerData();
  }

  private handleShieldBlock(): void {
    const hasShield = this.playerData.items.shield !== 'none';
    const wasBlocking = this.isBlocking;

    this.isBlocking = hasShield && this.shieldKey.isDown && !this.isCarrying;

    // Callback on state change
    if (wasBlocking !== this.isBlocking && this.onShieldBlock) {
      this.onShieldBlock(this.isBlocking);
    }
  }

  private updateDash(time: number, delta: number): void {
    this.dashTimer -= delta;

    if (this.dashTimer <= 0) {
      this.isDashing = false;
      this.dashCooldown = 500; // Cooldown after dash
      return;
    }

    // Continue moving in dash direction
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dirVec = DIRECTION_VECTORS[this.facing];
    body.setVelocity(dirVec.x * this.dashSpeed, dirVec.y * this.dashSpeed);
  }

  private updateCarriedObject(): void {
    if (this.isCarrying && this.carriedObject) {
      this.carriedObject.x = this.x;
      this.carriedObject.y = this.y - TILE_SIZE * SCALE;
      this.carriedObject.setDepth(this.depth + 1);
    }
  }

  public startDash(): void {
    if (!this.playerData.items.boots || this.dashCooldown > 0 || this.isDashing) {
      return;
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;

    // Start dash velocity
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dirVec = DIRECTION_VECTORS[this.facing];
    body.setVelocity(dirVec.x * this.dashSpeed, dirVec.y * this.dashSpeed);
  }

  public liftObject(obj: Phaser.GameObjects.Sprite): void {
    if (this.isCarrying) return;

    this.isCarrying = true;
    this.carriedObject = obj;
  }

  public throwCarriedObject(): void {
    if (!this.isCarrying || !this.carriedObject) return;

    // The interactable will handle the throw logic
    this.isCarrying = false;
    this.carriedObject = null;
  }

  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    // Vertical movement (priority over horizontal for LTTP feel)
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      vy = -PLAYER_SPEED;
      this.facing = Direction.UP;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      vy = PLAYER_SPEED;
      this.facing = Direction.DOWN;
    }

    // Horizontal movement (only if not moving vertically, for 4-direction movement)
    if (vy === 0) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
        vx = -PLAYER_SPEED;
        this.facing = Direction.LEFT;
      } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
        vx = PLAYER_SPEED;
        this.facing = Direction.RIGHT;
      }
    }

    body.setVelocity(vx, vy);
  }

  private handleCombat(time: number): void {
    const swordPressed = this.swordKey.isDown || this.swordKey2.isDown;

    if (swordPressed && !this.isAttacking && this.attackCooldown <= 0) {
      if (!this.spinCharging) {
        // Start charging spin attack
        this.spinCharging = true;
        this.spinChargeStart = time;
      }
    } else if (!swordPressed && this.spinCharging) {
      // Released sword button
      const chargeTime = time - this.spinChargeStart;

      if (chargeTime >= SPIN_ATTACK_CHARGE_TIME) {
        // Spin attack!
        this.performSpinAttack();
      } else {
        // Normal attack
        this.performAttack();
      }

      this.spinCharging = false;
    }
  }

  private performAttack(): void {
    this.isAttacking = true;
    this.attackCooldown = SWORD_COOLDOWN;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Play attack animation
    const dirName = this.getDirectionName();
    this.play(`player_attack_${dirName}`);

    // Notify combat system
    if (this.onAttack) {
      this.onAttack(this, SWORD_DAMAGE, false);
    }
  }

  private performSpinAttack(): void {
    this.isAttacking = true;
    this.attackCooldown = SWORD_COOLDOWN * 1.5;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Play attack animation
    const dirName = this.getDirectionName();
    this.play(`player_attack_${dirName}`);

    // Notify combat system (spin attack hits all directions with more damage)
    if (this.onAttack) {
      this.onAttack(this, SPIN_ATTACK_DAMAGE, true);
    }
  }

  private updateAttack(time: number, delta: number): void {
    // Wait for attack animation to complete
    if (!this.anims.isPlaying) {
      this.isAttacking = false;
    }
  }

  private handleItems(time: number): void {
    if ((this.itemKey.isDown || this.itemKey2.isDown) && this.canUseItem) {
      this.useItem();
    }
  }

  private useItem(): void {
    const equipped = this.playerData.equippedItem;
    const items = this.playerData.items;

    // Check magic cost
    const magicCost = ITEM_MAGIC_COST[equipped] || 0;
    if (this.magic < magicCost) return;

    let used = false;

    switch (equipped) {
      case 'bombs':
        if (this.playerData.bombs > 0) {
          this.playerData.bombs--;
          this.fireProjectile('bomb');
          used = true;
        }
        break;
      case 'bow':
        if (items.bow && this.playerData.arrows > 0) {
          this.playerData.arrows--;
          this.fireProjectile('arrow');
          used = true;
        }
        break;
      case 'boomerang':
        if (items.boomerang !== 'none') {
          this.fireProjectile('boomerang');
          used = true;
        }
        break;
      case 'hookshot':
        if (items.hookshot) {
          this.fireProjectile('hookshot');
          used = true;
        }
        break;
      case 'fire_rod':
        if (items.fire_rod) {
          this.magic -= magicCost;
          this.fireProjectile('fire');
          used = true;
        }
        break;
      case 'ice_rod':
        if (items.ice_rod) {
          this.magic -= magicCost;
          this.fireProjectile('ice');
          used = true;
        }
        break;
      case 'lamp':
        if (items.lamp && this.magic >= 2) {
          this.magic -= 2;
          this.useLamp();
          used = true;
        }
        break;
      case 'hammer':
        if (items.hammer) {
          this.useHammer();
          used = true;
        }
        break;
      case 'boots':
        if (items.boots) {
          this.startDash();
          used = true;
        }
        break;
    }

    if (used) {
      this.canUseItem = false;
      this.itemCooldown = 150;  // Fast item usage
    }
  }

  private useLamp(): void {
    this.lampActive = true;

    // Create light effect at player position + direction offset
    const offset = DIRECTION_VECTORS[this.facing];
    const lampX = this.x + offset.x * TILE_SIZE * SCALE;
    const lampY = this.y + offset.y * TILE_SIZE * SCALE;

    if (this.onLampUse) {
      this.onLampUse(lampX, lampY, this.lampRadius);
    }

    // Also fire a small fire projectile
    this.fireProjectile('fire');

    // Lamp stays lit for a bit
    this.scene.time.delayedCall(3000, () => {
      this.lampActive = false;
    });
  }

  private useHammer(): void {
    // Stop movement during hammer use
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Calculate hammer hit position
    const offset = DIRECTION_VECTORS[this.facing];
    const hammerX = this.x + offset.x * TILE_SIZE * SCALE;
    const hammerY = this.y + offset.y * TILE_SIZE * SCALE;

    if (this.onHammerUse) {
      this.onHammerUse(hammerX, hammerY, this.facing);
    }

    // Also does sword damage in a small area
    if (this.onAttack) {
      this.onAttack(this, ITEM_DAMAGE['hammer'] || 4, false);
    }

    // Small screen shake for hammer impact
    this.scene.cameras.main.shake(100, 0.01);
  }

  private fireProjectile(type: string): void {
    if (this.onProjectile) {
      const offset = DIRECTION_VECTORS[this.facing];
      const projX = this.x + offset.x * TILE_SIZE * SCALE;
      const projY = this.y + offset.y * TILE_SIZE * SCALE;
      this.onProjectile(projX, projY, this.facing, type);
    }
  }

  private updateCooldowns(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.itemCooldown > 0) {
      this.itemCooldown -= delta;
      if (this.itemCooldown <= 0) {
        this.canUseItem = true;
      }
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown -= delta;
    }
  }

  private updateInvincibility(time: number, delta: number): void {
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.flickerTimer += delta;

      // Flicker effect
      if (this.flickerTimer > 50) {
        this.setAlpha(this.alpha === 1 ? 0.3 : 1);
        this.flickerTimer = 0;
      }

      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.setAlpha(1);
      }
    }
  }

  private updateAnimation(): void {
    if (this.isAttacking) return;

    const dirName = this.getDirectionName();
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.velocity.x !== 0 || body.velocity.y !== 0) {
      // Walking
      const animKey = `player_walk_${dirName}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey);
      }
    } else {
      // Idle
      this.setTexture(`player_idle_${dirName}`);
      this.anims.stop();
    }
  }

  private getDirectionName(): string {
    switch (this.facing) {
      case Direction.UP: return 'up';
      case Direction.DOWN: return 'down';
      case Direction.LEFT: return 'left';
      case Direction.RIGHT: return 'right';
    }
  }

  public takeDamage(amount: number, sourceX: number, sourceY: number): boolean {
    if (this.isInvincible) return false;

    // Check shield block
    if (this.isBlocking) {
      // Calculate if attack is from the front (blocked)
      const angleToSource = Phaser.Math.Angle.Between(this.x, this.y, sourceX, sourceY);
      const facingAngle = this.getFacingAngle();
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToSource - facingAngle));

      // Block if attack is within ~90 degrees of facing direction
      if (angleDiff < Math.PI / 2) {
        // Blocked! Small knockback but no damage
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
        const knockbackForce = 100; // Reduced knockback
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
          Math.cos(angle) * knockbackForce,
          Math.sin(angle) * knockbackForce
        );
        return false;
      }
    }

    this.health -= amount;
    this.playerData.health = this.health;

    // Knockback
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
    const knockbackForce = 200;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * knockbackForce,
      Math.sin(angle) * knockbackForce
    );

    // Start invincibility
    this.isInvincible = true;
    this.invincibleTimer = INVINCIBILITY_DURATION;
    this.flickerTimer = 0;

    // Check for death
    if (this.health <= 0) {
      this.die();
    }

    return true;
  }

  private getFacingAngle(): number {
    switch (this.facing) {
      case Direction.UP: return -Math.PI / 2;
      case Direction.DOWN: return Math.PI / 2;
      case Direction.LEFT: return Math.PI;
      case Direction.RIGHT: return 0;
    }
  }

  public heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.playerData.health = this.health;
  }

  public restoreMagic(amount: number): void {
    this.magic = Math.min(this.magic + amount, this.maxMagic);
    this.playerData.magic = this.magic;
  }

  private die(): void {
    // Emit death event - GameScene will handle transition to GameOverScene
    this.scene.events.emit('playerDeath');
  }

  private syncPlayerData(): void {
    this.playerData.position.x = this.x;
    this.playerData.position.y = this.y;
    this.playerData.direction = this.facing;
    this.playerData.health = this.health;
    this.playerData.magic = this.magic;
  }

  public getAttackHitbox(): Phaser.Geom.Rectangle {
    const size = TILE_SIZE * SCALE;
    const offset = DIRECTION_VECTORS[this.facing];

    return new Phaser.Geom.Rectangle(
      this.x + offset.x * size - size / 2,
      this.y + offset.y * size - size / 2,
      size,
      size
    );
  }

  public getSpinAttackHitbox(): Phaser.Geom.Rectangle {
    const size = TILE_SIZE * SCALE * 2.5;
    return new Phaser.Geom.Rectangle(
      this.x - size / 2,
      this.y - size / 2,
      size,
      size
    );
  }
}
