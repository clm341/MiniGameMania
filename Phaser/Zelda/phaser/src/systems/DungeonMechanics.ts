// DungeonMechanics - Handles dungeon-specific gameplay elements

import Phaser from 'phaser';
import { TILE_SIZE, SCALE, Direction, DIRECTION_VECTORS } from '../config';
import { Player } from '../entities/Player';
import { Interactable } from '../entities/Interactable';

interface SwitchConnection {
  switchId: string;
  targetIds: string[];
  action: 'open_door' | 'toggle_blocks' | 'reveal_chest' | 'extend_bridge';
  oneTime: boolean;
}

interface PitData {
  x: number;
  y: number;
  fallTargetRoom?: string;
  fallTargetX?: number;
  fallTargetY?: number;
  damage: number;
}

export class DungeonMechanics {
  private scene: Phaser.Scene;
  private player: Player;

  // Switches and their connections
  private switchConnections: Map<string, SwitchConnection> = new Map();
  private activatedSwitches: Set<string> = new Set();

  // Pits in current room
  private pits: PitData[] = [];

  // Dark room state
  private isDarkRoom: boolean = false;
  private lightSources: { x: number; y: number; radius: number; permanent: boolean }[] = [];
  private darknessOverlay: Phaser.GameObjects.Graphics | null = null;
  private lightMask: Phaser.GameObjects.Graphics | null = null;

  // Pressure plates
  private pressurePlates: Map<string, Interactable> = new Map();

  // Callbacks
  public onDoorOpen?: (doorId: string) => void;
  public onPlayerFall?: (targetRoom: string, targetX: number, targetY: number, damage: number) => void;
  public onBlockToggle?: (blockIds: string[], raised: boolean) => void;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
  }

  // ==================== DARK ROOM SYSTEM ====================

  public setupDarkRoom(isDark: boolean): void {
    this.isDarkRoom = isDark;

    if (isDark) {
      this.createDarknessOverlay();
    } else {
      this.clearDarknessOverlay();
    }
  }

  private createDarknessOverlay(): void {
    // Create a darkness layer that covers the whole room
    this.darknessOverlay = this.scene.add.graphics();
    this.darknessOverlay.setDepth(1000);

    // Create the light mask
    this.lightMask = this.scene.add.graphics();

    this.updateDarkness();
  }

  private clearDarknessOverlay(): void {
    if (this.darknessOverlay) {
      this.darknessOverlay.destroy();
      this.darknessOverlay = null;
    }
    if (this.lightMask) {
      this.lightMask.destroy();
      this.lightMask = null;
    }
    this.lightSources = [];
  }

  public addLightSource(x: number, y: number, radius: number, permanent: boolean = false): void {
    this.lightSources.push({ x, y, radius, permanent });

    if (!permanent) {
      // Temporary light fades after a few seconds
      this.scene.time.delayedCall(3000, () => {
        this.removeLightSource(x, y);
      });
    }

    this.updateDarkness();
  }

  public removeLightSource(x: number, y: number): void {
    this.lightSources = this.lightSources.filter(
      light => !(Math.abs(light.x - x) < 10 && Math.abs(light.y - y) < 10 && !light.permanent)
    );
    this.updateDarkness();
  }

  private updateDarkness(): void {
    if (!this.darknessOverlay || !this.isDarkRoom) return;

    const width = this.scene.cameras.main.width * 2;
    const height = this.scene.cameras.main.height * 2;

    this.darknessOverlay.clear();

    // Fill with darkness
    this.darknessOverlay.fillStyle(0x000000, 0.95);
    this.darknessOverlay.fillRect(
      this.scene.cameras.main.scrollX - width / 4,
      this.scene.cameras.main.scrollY - height / 4,
      width,
      height
    );

    // Cut out light sources using blend mode
    this.darknessOverlay.setBlendMode(Phaser.BlendModes.ERASE);

    // Player always has a tiny bit of light
    this.darknessOverlay.fillStyle(0xffffff, 1);
    this.darknessOverlay.fillCircle(this.player.x, this.player.y, 30);

    // Draw light sources
    for (const light of this.lightSources) {
      // Gradient-like effect using multiple circles
      for (let i = 5; i >= 1; i--) {
        const alpha = 1 - (i / 6);
        this.darknessOverlay.fillStyle(0xffffff, alpha);
        this.darknessOverlay.fillCircle(light.x, light.y, light.radius * (i / 5));
      }
    }

    this.darknessOverlay.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  public useLamp(x: number, y: number, radius: number): void {
    this.addLightSource(x, y, radius, false);

    // Also light any nearby torches permanently
    // This would check for torch interactables nearby
  }

  // ==================== SWITCH SYSTEM ====================

  public registerSwitch(switchId: string, connection: SwitchConnection): void {
    this.switchConnections.set(switchId, connection);
  }

  public activateSwitch(switchId: string, activated: boolean): void {
    const connection = this.switchConnections.get(switchId);
    if (!connection) return;

    // Check if one-time switch already used
    if (connection.oneTime && this.activatedSwitches.has(switchId)) {
      return;
    }

    if (activated) {
      this.activatedSwitches.add(switchId);
    } else if (!connection.oneTime) {
      this.activatedSwitches.delete(switchId);
    }

    // Perform action
    switch (connection.action) {
      case 'open_door':
        for (const targetId of connection.targetIds) {
          if (this.onDoorOpen) {
            this.onDoorOpen(targetId);
          }
        }
        break;
      case 'toggle_blocks':
        if (this.onBlockToggle) {
          this.onBlockToggle(connection.targetIds, activated);
        }
        break;
      case 'reveal_chest':
        // Reveal hidden chest
        for (const targetId of connection.targetIds) {
          this.scene.events.emit('revealChest', targetId);
        }
        break;
      case 'extend_bridge':
        // Create bridge tiles
        for (const targetId of connection.targetIds) {
          this.scene.events.emit('extendBridge', targetId);
        }
        break;
    }
  }

  public registerPressurePlate(plateId: string, plate: Interactable): void {
    this.pressurePlates.set(plateId, plate);
  }

  // ==================== PIT SYSTEM ====================

  public addPit(pitData: PitData): void {
    this.pits.push(pitData);
  }

  public clearPits(): void {
    this.pits = [];
  }

  public checkPitCollision(playerX: number, playerY: number): PitData | null {
    const tileSize = TILE_SIZE * SCALE;

    for (const pit of this.pits) {
      const dx = Math.abs(playerX - pit.x);
      const dy = Math.abs(playerY - pit.y);

      if (dx < tileSize * 0.4 && dy < tileSize * 0.4) {
        return pit;
      }
    }

    return null;
  }

  public handlePitFall(pit: PitData): void {
    // Play fall animation
    this.scene.tweens.add({
      targets: this.player,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // Reset player appearance
        this.player.setScale(SCALE);
        this.player.setAlpha(1);

        // Apply damage
        this.player.takeDamage(pit.damage, this.player.x, this.player.y);

        // Teleport to fall target or reset position
        if (pit.fallTargetRoom && this.onPlayerFall) {
          this.onPlayerFall(
            pit.fallTargetRoom,
            pit.fallTargetX || this.player.x,
            pit.fallTargetY || this.player.y,
            pit.damage
          );
        } else {
          // Just respawn at room entrance
          this.player.x = 7 * TILE_SIZE * SCALE;
          this.player.y = 11 * TILE_SIZE * SCALE;
        }
      }
    });
  }

  // ==================== KEY/DOOR SYSTEM ====================

  public canOpenLockedDoor(hasKey: boolean): boolean {
    return hasKey;
  }

  public canOpenBossDoor(hasBossKey: boolean, dungeonId: string, playerBossKeys: string[]): boolean {
    return hasBossKey || playerBossKeys.includes(dungeonId);
  }

  public openLockedDoor(door: Interactable): void {
    // Play unlock animation
    this.scene.tweens.add({
      targets: door,
      alpha: 0,
      y: door.y - TILE_SIZE * SCALE,
      duration: 300,
      onComplete: () => {
        door.destroy();
      }
    });
  }

  // ==================== UPDATE ====================

  update(time: number, delta: number): void {
    // Update darkness overlay position
    if (this.isDarkRoom) {
      this.updateDarkness();
    }

    // Check pressure plates
    this.pressurePlates.forEach((plate, id) => {
      const dx = Math.abs(this.player.x - plate.x);
      const dy = Math.abs(this.player.y - plate.y);
      const isPressed = dx < TILE_SIZE * SCALE * 0.5 && dy < TILE_SIZE * SCALE * 0.5;
      plate.onPressurePlateStep(isPressed);
    });

    // Check pit collision
    const pit = this.checkPitCollision(this.player.x, this.player.y);
    if (pit && !this.player.isDashing) {
      this.handlePitFall(pit);
    }
  }

  // ==================== CLEANUP ====================

  cleanup(): void {
    this.clearDarknessOverlay();
    this.clearPits();
    this.switchConnections.clear();
    this.activatedSwitches.clear();
    this.pressurePlates.clear();
    this.lightSources = [];
  }
}
