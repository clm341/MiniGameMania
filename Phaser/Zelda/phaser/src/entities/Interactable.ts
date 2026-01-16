// Interactable objects - grass, pots, rocks, chests, switches, etc.

import Phaser from 'phaser';
import { TILE_SIZE, SCALE, Direction, DIRECTION_VECTORS } from '../config';

export type InteractableType = 'grass' | 'bush' | 'pot' | 'rock' | 'chest' | 'sign' | 'switch' | 'pressure_plate' | 'locked_door' | 'boss_door';

interface DropTableEntry {
  type: string;
  chance: number;
}

const DROP_TABLES: Record<InteractableType, DropTableEntry[]> = {
  grass: [
    { type: 'rupee_green', chance: 0.15 },
    { type: 'heart', chance: 0.08 },
    { type: 'magic_jar_small', chance: 0.05 },
    { type: 'arrow', chance: 0.05 },
    { type: 'bomb', chance: 0.03 },
  ],
  bush: [
    { type: 'rupee_green', chance: 0.2 },
    { type: 'heart', chance: 0.1 },
    { type: 'rupee_blue', chance: 0.05 },
  ],
  pot: [
    { type: 'rupee_green', chance: 0.3 },
    { type: 'heart', chance: 0.15 },
    { type: 'rupee_blue', chance: 0.1 },
    { type: 'bomb', chance: 0.08 },
    { type: 'arrow', chance: 0.08 },
    { type: 'magic_jar_small', chance: 0.05 },
  ],
  rock: [
    { type: 'rupee_green', chance: 0.1 },
    { type: 'rupee_blue', chance: 0.05 },
  ],
  chest: [], // Chests have fixed contents
  sign: [],
  switch: [],
  pressure_plate: [],
  locked_door: [],
  boss_door: [],
};

export class Interactable extends Phaser.Physics.Arcade.Sprite {
  public interactableType: InteractableType;
  public isDestroyed: boolean = false;
  public isActivated: boolean = false;
  public requiresItem: string | null = null;
  public contents: string | null = null;

  // For lifted objects
  public isLifted: boolean = false;
  public liftedBy: Phaser.Physics.Arcade.Sprite | null = null;

  // Callbacks
  public onDestroy?: (interactable: Interactable) => void;
  public onDrop?: (x: number, y: number, dropType: string) => void;
  public onActivate?: (interactable: Interactable) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: InteractableType,
    contents?: string
  ) {
    const textureKey = Interactable.getTextureForType(type);
    super(scene, x, y, textureKey);

    this.interactableType = type;
    this.contents = contents || null;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body by default

    // Scale sprite
    this.setScale(SCALE);

    // Set depth for Y-sorting
    this.setDepth(y);

    // Set required items for certain types
    this.setupRequirements();
  }

  private static getTextureForType(type: InteractableType): string {
    switch (type) {
      case 'grass': return 'interactable_grass';
      case 'bush': return 'interactable_bush';
      case 'pot': return 'interactable_pot';
      case 'rock': return 'interactable_rock';
      case 'chest': return 'interactable_chest';
      case 'sign': return 'interactable_sign';
      case 'switch': return 'interactable_switch';
      case 'pressure_plate': return 'interactable_pressure_plate';
      case 'locked_door': return 'interactable_door_locked';
      case 'boss_door': return 'interactable_door_boss';
      default: return 'interactable_pot';
    }
  }

  private setupRequirements(): void {
    switch (this.interactableType) {
      case 'grass':
      case 'bush':
        this.requiresItem = 'sword'; // Can also be cut with other items
        break;
      case 'rock':
        this.requiresItem = 'glove'; // Power glove or titan mitt
        break;
      case 'pot':
        this.requiresItem = null; // Anyone can lift pots
        break;
      case 'locked_door':
        this.requiresItem = 'key';
        break;
      case 'boss_door':
        this.requiresItem = 'boss_key';
        break;
    }
  }

  public canInteract(itemUsed: string, gloveLevel: string = 'none'): boolean {
    switch (this.interactableType) {
      case 'grass':
      case 'bush':
        // Sword, boomerang (magic), fire rod, bombs can cut grass
        return ['sword', 'boomerang_magic', 'fire_rod', 'bomb', 'hookshot'].includes(itemUsed);
      case 'pot':
        return true; // Anyone can lift pots
      case 'rock':
        // Need power glove for small rocks, titan mitt for large
        return gloveLevel === 'power' || gloveLevel === 'titan';
      case 'chest':
        return !this.isActivated;
      case 'switch':
        return true;
      case 'pressure_plate':
        return true;
      case 'locked_door':
        return itemUsed === 'key';
      case 'boss_door':
        return itemUsed === 'boss_key';
      default:
        return false;
    }
  }

  public interact(itemUsed: string, direction: Direction, gloveLevel: string = 'none'): void {
    if (this.isDestroyed || !this.canInteract(itemUsed, gloveLevel)) return;

    switch (this.interactableType) {
      case 'grass':
      case 'bush':
        this.cut();
        break;
      case 'pot':
        this.lift();
        break;
      case 'rock':
        this.lift();
        break;
      case 'chest':
        this.openChest();
        break;
      case 'switch':
        this.toggleSwitch();
        break;
      case 'locked_door':
      case 'boss_door':
        this.unlock();
        break;
    }
  }

  private cut(): void {
    this.isDestroyed = true;

    // Play cut animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: SCALE * 1.5,
      scaleY: SCALE * 0.5,
      duration: 150,
      onComplete: () => {
        this.spawnDrop();
        if (this.onDestroy) {
          this.onDestroy(this);
        }
        this.destroy();
      }
    });

    // Create grass/leaf particles
    this.createCutParticles();
  }

  private createCutParticles(): void {
    const colors = this.interactableType === 'grass'
      ? [0x228B22, 0x32CD32, 0x2d9d2d]
      : [0x228B22, 0x32CD32, 0x1a7a1a];

    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-8, 8),
        this.y + Phaser.Math.Between(-8, 8),
        4, 4,
        Phaser.Math.RND.pick(colors)
      );
      particle.setDepth(this.depth + 1);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-20, 20),
        y: particle.y + Phaser.Math.Between(-30, -10),
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy()
      });
    }
  }

  public lift(): void {
    if (this.isLifted) return;

    this.isLifted = true;

    // Make body non-static so it can be thrown
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  public throw(direction: Direction, thrower: Phaser.Physics.Arcade.Sprite): void {
    if (!this.isLifted) return;

    this.isLifted = false;
    this.liftedBy = null;

    // Set position in front of thrower
    const offset = DIRECTION_VECTORS[direction];
    const startX = thrower.x + offset.x * TILE_SIZE * SCALE;
    const startY = thrower.y + offset.y * TILE_SIZE * SCALE;
    this.x = startX;
    this.y = startY;

    // Calculate throw destination
    const throwDistance = TILE_SIZE * SCALE * 4;
    const targetX = startX + offset.x * throwDistance;
    const targetY = startY + offset.y * throwDistance;

    // Use tween for throw animation instead of physics velocity
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 400,
      ease: 'Linear',
      onComplete: () => {
        this.shatter();
      }
    });
  }

  private getAngleFromDirection(direction: Direction): number {
    switch (direction) {
      case Direction.UP: return -90;
      case Direction.DOWN: return 90;
      case Direction.LEFT: return 180;
      case Direction.RIGHT: return 0;
    }
  }

  public shatter(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Play shatter animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.spawnDrop();
        if (this.onDestroy) {
          this.onDestroy(this);
        }
        this.destroy();
      }
    });

    // Create shatter particles
    this.createShatterParticles();
  }

  private createShatterParticles(): void {
    const color = this.interactableType === 'pot' ? 0xB87333 : 0x888888;

    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-4, 4),
        this.y + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(3, 6),
        Phaser.Math.Between(3, 6),
        color
      );
      particle.setDepth(this.depth + 1);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-30, 30),
        y: particle.y + Phaser.Math.Between(-20, 20),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }
  }

  private openChest(): void {
    if (this.isActivated) return;
    this.isActivated = true;

    // Change to open chest texture
    this.setTexture('interactable_chest_open');

    // Spawn contents
    if (this.contents && this.onDrop) {
      // Delay for dramatic effect
      this.scene.time.delayedCall(200, () => {
        this.onDrop!(this.x, this.y - TILE_SIZE * SCALE, this.contents!);
      });
    }

    if (this.onActivate) {
      this.onActivate(this);
    }
  }

  private toggleSwitch(): void {
    this.isActivated = !this.isActivated;

    // Change texture based on state
    this.setTexture(this.isActivated ? 'interactable_switch_on' : 'interactable_switch');

    if (this.onActivate) {
      this.onActivate(this);
    }
  }

  private unlock(): void {
    if (this.isActivated) return;
    this.isActivated = true;

    // Door opening animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - TILE_SIZE * SCALE,
      duration: 300,
      onComplete: () => {
        if (this.onActivate) {
          this.onActivate(this);
        }
        this.destroy();
      }
    });
  }

  private spawnDrop(): void {
    const dropTable = DROP_TABLES[this.interactableType];
    if (!dropTable || dropTable.length === 0) return;

    // Roll for drops
    for (const entry of dropTable) {
      if (Math.random() < entry.chance) {
        if (this.onDrop) {
          this.onDrop(this.x, this.y, entry.type);
        }
        break; // Only one drop per object
      }
    }
  }

  // Called when player stands on pressure plate
  public onPressurePlateStep(isPressed: boolean): void {
    if (this.interactableType !== 'pressure_plate') return;

    const wasActivated = this.isActivated;
    this.isActivated = isPressed;

    // Change texture
    this.setTexture(isPressed ? 'interactable_pressure_plate_down' : 'interactable_pressure_plate');

    // Only trigger callback on state change
    if (wasActivated !== isPressed && this.onActivate) {
      this.onActivate(this);
    }
  }

  update(time: number, delta: number): void {
    // If lifted, follow the lifter
    if (this.isLifted && this.liftedBy) {
      this.x = this.liftedBy.x;
      this.y = this.liftedBy.y - TILE_SIZE * SCALE;
      this.setDepth(this.liftedBy.depth + 1);
    } else {
      // Y-sorting
      this.setDepth(this.y);
    }
  }
}
