// RoomManager - Handles room transitions, room data loading, and screen scrolling

import Phaser from 'phaser';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
  SCALE,
  Direction,
  DIRECTION_VECTORS,
} from '../config';

export interface RoomData {
  id: string;
  map: string[];
  enemies: { x: number; y: number; type: string }[];
  interactables: { x: number; y: number; type: string; contents?: string }[];
  doors: DoorData[];
  isDungeon: boolean;
  darkRoom: boolean;
}

export interface DoorData {
  x: number;
  y: number;
  direction: Direction;
  targetRoom: string;
  targetX: number;
  targetY: number;
  locked?: boolean;
  bossLocked?: boolean;
}

type TransitionType = 'scroll' | 'fade' | 'door';

export class RoomManager {
  private scene: Phaser.Scene;
  private currentRoom: string = 'overworld_8_8';
  private rooms: Map<string, RoomData> = new Map();
  private isTransitioning: boolean = false;
  private transitionDuration: number = 300;

  // Room dimensions
  private roomWidth: number;
  private roomHeight: number;
  private tileSize: number;

  // Callbacks
  public onRoomChange?: (oldRoom: string, newRoom: string, roomData: RoomData) => void;
  public onTransitionStart?: () => void;
  public onTransitionEnd?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tileSize = TILE_SIZE * SCALE;
    this.roomWidth = 16 * this.tileSize;  // 16 tiles wide
    this.roomHeight = 14 * this.tileSize; // 14 tiles tall (minus HUD)

    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms(): void {
    // Generate a grid of overworld rooms
    for (let rx = 0; rx < 4; rx++) {
      for (let ry = 0; ry < 4; ry++) {
        const roomId = `overworld_${rx}_${ry}`;
        this.rooms.set(roomId, this.generateOverworldRoom(rx, ry));
      }
    }

    // Add a test dungeon entrance room
    this.rooms.set('dungeon_1_entrance', this.generateDungeonRoom('entrance'));
    this.rooms.set('dungeon_1_main', this.generateDungeonRoom('main'));
    this.rooms.set('dungeon_1_boss', this.generateDungeonRoom('boss'));
  }

  private generateOverworldRoom(rx: number, ry: number): RoomData {
    const map: string[] = [];
    const enemies: { x: number; y: number; type: string }[] = [];
    const interactables: { x: number; y: number; type: string; contents?: string }[] = [];
    const doors: DoorData[] = [];

    // Generate basic room layout
    for (let y = 0; y < 14; y++) {
      let row = '';
      for (let x = 0; x < 16; x++) {
        // Border walls
        if (y === 0 || y === 13 || x === 0 || x === 15) {
          // Exits to adjacent rooms
          const isHorizontalExit = (y === 6 || y === 7) && (x === 0 || x === 15);
          const isVerticalExit = (x === 7 || x === 8) && (y === 0 || y === 13);

          if (isHorizontalExit || isVerticalExit) {
            row += '.';
          } else {
            row += '#';
          }
        } else {
          // Random terrain
          const rand = Math.random();
          if (rand < 0.05 && y > 2 && y < 12 && x > 2 && x < 14) {
            row += 'T'; // Tree
          } else if (rand < 0.08) {
            row += 'g'; // Cuttable grass
          } else if (rand < 0.09) {
            row += 'R'; // Rock
          } else {
            row += '.'; // Grass floor
          }
        }
      }
      map.push(row);
    }

    // Add some enemies
    const enemyTypes = ['soldier_green', 'octorok', 'keese'];
    const numEnemies = Phaser.Math.Between(2, 4);
    for (let i = 0; i < numEnemies; i++) {
      enemies.push({
        x: Phaser.Math.Between(3, 12) * this.tileSize,
        y: Phaser.Math.Between(3, 10) * this.tileSize,
        type: Phaser.Math.RND.pick(enemyTypes)
      });
    }

    // Add interactables (grass patches, pots)
    for (let i = 0; i < 5; i++) {
      interactables.push({
        x: Phaser.Math.Between(2, 13) * this.tileSize,
        y: Phaser.Math.Between(2, 11) * this.tileSize,
        type: Math.random() < 0.7 ? 'grass' : 'pot'
      });
    }

    // Add doors to adjacent rooms
    if (rx > 0) {
      doors.push({
        x: 0,
        y: 6 * this.tileSize,
        direction: Direction.LEFT,
        targetRoom: `overworld_${rx - 1}_${ry}`,
        targetX: 14 * this.tileSize,
        targetY: 6 * this.tileSize
      });
    }
    if (rx < 3) {
      doors.push({
        x: 15 * this.tileSize,
        y: 6 * this.tileSize,
        direction: Direction.RIGHT,
        targetRoom: `overworld_${rx + 1}_${ry}`,
        targetX: 1 * this.tileSize,
        targetY: 6 * this.tileSize
      });
    }
    if (ry > 0) {
      doors.push({
        x: 7 * this.tileSize,
        y: 0,
        direction: Direction.UP,
        targetRoom: `overworld_${rx}_${ry - 1}`,
        targetX: 7 * this.tileSize,
        targetY: 12 * this.tileSize
      });
    }
    if (ry < 3) {
      doors.push({
        x: 7 * this.tileSize,
        y: 13 * this.tileSize,
        direction: Direction.DOWN,
        targetRoom: `overworld_${rx}_${ry + 1}`,
        targetX: 7 * this.tileSize,
        targetY: 1 * this.tileSize
      });
    }

    // Add dungeon entrance in room 1,1
    if (rx === 1 && ry === 1) {
      doors.push({
        x: 7 * this.tileSize,
        y: 5 * this.tileSize,
        direction: Direction.UP,
        targetRoom: 'dungeon_1_entrance',
        targetX: 7 * this.tileSize,
        targetY: 11 * this.tileSize
      });
    }

    return {
      id: `overworld_${rx}_${ry}`,
      map,
      enemies,
      interactables,
      doors,
      isDungeon: false,
      darkRoom: false
    };
  }

  private generateDungeonRoom(type: string): RoomData {
    const map: string[] = [];
    const enemies: { x: number; y: number; type: string }[] = [];
    const interactables: { x: number; y: number; type: string; contents?: string }[] = [];
    const doors: DoorData[] = [];

    // Dungeon floor/wall pattern
    for (let y = 0; y < 14; y++) {
      let row = '';
      for (let x = 0; x < 16; x++) {
        // Dungeon walls
        if (y === 0 || y === 13 || x === 0 || x === 15) {
          // Exits
          const isHorizontalExit = (y === 6 || y === 7) && (x === 0 || x === 15);
          const isVerticalExit = (x === 7 || x === 8) && (y === 0 || y === 13);

          if (isHorizontalExit || isVerticalExit) {
            row += 'D'; // Dungeon floor
          } else {
            row += 'W'; // Dungeon wall
          }
        } else {
          row += 'D'; // Dungeon floor
        }
      }
      map.push(row);
    }

    if (type === 'entrance') {
      // Add pot with a key
      interactables.push({
        x: 4 * this.tileSize,
        y: 6 * this.tileSize,
        type: 'pot'
      });
      interactables.push({
        x: 11 * this.tileSize,
        y: 6 * this.tileSize,
        type: 'pot'
      });

      // Chest with map
      interactables.push({
        x: 7 * this.tileSize,
        y: 3 * this.tileSize,
        type: 'chest',
        contents: 'map'
      });

      // Exit back to overworld
      doors.push({
        x: 7 * this.tileSize,
        y: 13 * this.tileSize,
        direction: Direction.DOWN,
        targetRoom: 'overworld_1_1',
        targetX: 7 * this.tileSize,
        targetY: 6 * this.tileSize
      });

      // Door to main room
      doors.push({
        x: 7 * this.tileSize,
        y: 0,
        direction: Direction.UP,
        targetRoom: 'dungeon_1_main',
        targetX: 7 * this.tileSize,
        targetY: 12 * this.tileSize
      });

      enemies.push({ x: 5 * this.tileSize, y: 8 * this.tileSize, type: 'stalfos' });
      enemies.push({ x: 10 * this.tileSize, y: 8 * this.tileSize, type: 'stalfos' });
    }

    if (type === 'main') {
      // Add switches and blocks
      interactables.push({
        x: 4 * this.tileSize,
        y: 4 * this.tileSize,
        type: 'switch'
      });
      interactables.push({
        x: 11 * this.tileSize,
        y: 4 * this.tileSize,
        type: 'pressure_plate'
      });

      // Chest with key
      interactables.push({
        x: 7 * this.tileSize,
        y: 6 * this.tileSize,
        type: 'chest',
        contents: 'key'
      });

      doors.push({
        x: 7 * this.tileSize,
        y: 13 * this.tileSize,
        direction: Direction.DOWN,
        targetRoom: 'dungeon_1_entrance',
        targetX: 7 * this.tileSize,
        targetY: 1 * this.tileSize
      });

      // Locked door to boss
      doors.push({
        x: 7 * this.tileSize,
        y: 0,
        direction: Direction.UP,
        targetRoom: 'dungeon_1_boss',
        targetX: 7 * this.tileSize,
        targetY: 12 * this.tileSize,
        locked: true
      });

      enemies.push({ x: 3 * this.tileSize, y: 7 * this.tileSize, type: 'keese' });
      enemies.push({ x: 12 * this.tileSize, y: 7 * this.tileSize, type: 'keese' });
      enemies.push({ x: 7 * this.tileSize, y: 10 * this.tileSize, type: 'stalfos' });
    }

    if (type === 'boss') {
      // Boss chest with big prize
      interactables.push({
        x: 7 * this.tileSize,
        y: 3 * this.tileSize,
        type: 'chest',
        contents: 'heart_piece'
      });

      doors.push({
        x: 7 * this.tileSize,
        y: 13 * this.tileSize,
        direction: Direction.DOWN,
        targetRoom: 'dungeon_1_main',
        targetX: 7 * this.tileSize,
        targetY: 1 * this.tileSize
      });

      // Boss enemy
      enemies.push({ x: 7 * this.tileSize, y: 7 * this.tileSize, type: 'moblin' });
    }

    return {
      id: `dungeon_1_${type}`,
      map,
      enemies,
      interactables,
      doors,
      isDungeon: true,
      darkRoom: type === 'main' // Main room is dark, needs lamp
    };
  }

  public getCurrentRoom(): RoomData | undefined {
    return this.rooms.get(this.currentRoom);
  }

  public getRoomData(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  public setCurrentRoom(roomId: string): void {
    this.currentRoom = roomId;
  }

  public isInTransition(): boolean {
    return this.isTransitioning;
  }

  public checkRoomTransition(playerX: number, playerY: number, playerDirection: Direction): DoorData | null {
    if (this.isTransitioning) return null;

    const currentRoomData = this.getCurrentRoom();
    if (!currentRoomData) return null;

    const threshold = this.tileSize * 0.5;

    for (const door of currentRoomData.doors) {
      const dx = Math.abs(playerX - door.x);
      const dy = Math.abs(playerY - door.y);

      // Check if player is near the door and moving in the right direction
      if (dx < threshold && dy < threshold) {
        // Check direction alignment
        if (door.direction === playerDirection) {
          return door;
        }
      }
    }

    // Check screen edge transitions (for scrolling rooms)
    const margin = this.tileSize * 0.3;

    if (playerX < margin && playerDirection === Direction.LEFT) {
      const leftDoor = currentRoomData.doors.find(d => d.direction === Direction.LEFT);
      if (leftDoor) return leftDoor;
    }
    if (playerX > this.roomWidth - margin && playerDirection === Direction.RIGHT) {
      const rightDoor = currentRoomData.doors.find(d => d.direction === Direction.RIGHT);
      if (rightDoor) return rightDoor;
    }
    if (playerY < margin && playerDirection === Direction.UP) {
      const upDoor = currentRoomData.doors.find(d => d.direction === Direction.UP);
      if (upDoor) return upDoor;
    }
    if (playerY > this.roomHeight - margin && playerDirection === Direction.DOWN) {
      const downDoor = currentRoomData.doors.find(d => d.direction === Direction.DOWN);
      if (downDoor) return downDoor;
    }

    return null;
  }

  public transitionToRoom(
    door: DoorData,
    hasKey: boolean,
    hasBossKey: boolean,
    onComplete: (success: boolean, needsKey: boolean, needsBossKey: boolean) => void
  ): void {
    if (this.isTransitioning) {
      onComplete(false, false, false);
      return;
    }

    // Check locked doors
    if (door.locked && !hasKey) {
      onComplete(false, true, false);
      return;
    }
    if (door.bossLocked && !hasBossKey) {
      onComplete(false, false, true);
      return;
    }

    this.isTransitioning = true;

    if (this.onTransitionStart) {
      this.onTransitionStart();
    }

    // Determine transition type
    const currentRoomData = this.getCurrentRoom();
    const targetRoomData = this.rooms.get(door.targetRoom);
    const isDungeonTransition = currentRoomData?.isDungeon !== targetRoomData?.isDungeon;

    const transitionType: TransitionType = isDungeonTransition ? 'fade' : 'scroll';

    if (transitionType === 'fade') {
      this.fadeTransition(door, onComplete);
    } else {
      this.scrollTransition(door, onComplete);
    }
  }

  private fadeTransition(door: DoorData, onComplete: (success: boolean, needsKey: boolean, needsBossKey: boolean) => void): void {
    const camera = this.scene.cameras.main;

    camera.fadeOut(this.transitionDuration / 2, 0, 0, 0);

    this.scene.time.delayedCall(this.transitionDuration / 2, () => {
      const oldRoom = this.currentRoom;
      this.currentRoom = door.targetRoom;
      const newRoomData = this.getCurrentRoom();

      if (newRoomData && this.onRoomChange) {
        this.onRoomChange(oldRoom, this.currentRoom, newRoomData);
      }

      camera.fadeIn(this.transitionDuration / 2, 0, 0, 0);

      this.scene.time.delayedCall(this.transitionDuration / 2, () => {
        this.isTransitioning = false;
        if (this.onTransitionEnd) {
          this.onTransitionEnd();
        }
        onComplete(true, false, false);
      });
    });
  }

  private scrollTransition(door: DoorData, onComplete: (success: boolean, needsKey: boolean, needsBossKey: boolean) => void): void {
    const camera = this.scene.cameras.main;

    // Calculate scroll direction and distance
    const scrollDistance = door.direction === Direction.LEFT || door.direction === Direction.RIGHT
      ? this.roomWidth
      : this.roomHeight;

    const dirVec = DIRECTION_VECTORS[door.direction];

    // Emit pre-transition event so GameScene can prepare
    const oldRoom = this.currentRoom;
    this.currentRoom = door.targetRoom;
    const newRoomData = this.getCurrentRoom();

    if (newRoomData && this.onRoomChange) {
      this.onRoomChange(oldRoom, this.currentRoom, newRoomData);
    }

    // Screen scroll effect (quick blackout for simplicity)
    camera.fadeOut(100, 0, 0, 0);
    this.scene.time.delayedCall(100, () => {
      camera.fadeIn(200, 0, 0, 0);

      this.scene.time.delayedCall(200, () => {
        this.isTransitioning = false;
        if (this.onTransitionEnd) {
          this.onTransitionEnd();
        }
        onComplete(true, false, false);
      });
    });
  }

  // Register a custom room
  public registerRoom(roomData: RoomData): void {
    this.rooms.set(roomData.id, roomData);
  }

  // Get all doors in current room
  public getCurrentDoors(): DoorData[] {
    const room = this.getCurrentRoom();
    return room?.doors || [];
  }

  // Check if current room is dark
  public isCurrentRoomDark(): boolean {
    const room = this.getCurrentRoom();
    return room?.darkRoom || false;
  }

  // Check if current room is a dungeon
  public isCurrentRoomDungeon(): boolean {
    const room = this.getCurrentRoom();
    return room?.isDungeon || false;
  }
}
