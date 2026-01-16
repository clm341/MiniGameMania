// GameScene - Main gameplay scene

import Phaser from 'phaser';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
  SCALE,
  Colors,
  Direction,
  ENEMY_TYPES,
} from '../config';
import { PlayerData, getDefaultPlayerData } from '../types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Interactable, InteractableType } from '../entities/Interactable';
import { ItemDrop, DropType } from '../entities/ItemDrop';
import { CombatSystem } from '../systems/CombatSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { RoomManager, RoomData, DoorData } from '../systems/RoomManager';
import { DungeonMechanics } from '../systems/DungeonMechanics';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private playerData!: PlayerData;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private obstacleLayer!: Phaser.Physics.Arcade.StaticGroup;
  private combatSystem!: CombatSystem;

  // New systems
  private roomManager!: RoomManager;
  private dungeonMechanics!: DungeonMechanics;

  // Interactables and drops
  private interactables!: Phaser.Physics.Arcade.StaticGroup;
  private itemDrops!: Phaser.Physics.Arcade.Group;
  private tileSprites: Phaser.GameObjects.Sprite[] = [];

  // Input
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey2!: Phaser.Input.Keyboard.Key;
  private actionKey!: Phaser.Input.Keyboard.Key;

  // Tilemap data
  private tileSize: number = TILE_SIZE * SCALE;
  private mapData: string[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { newGame?: boolean; playerData?: PlayerData }): void {
    if (data.newGame || !data.playerData) {
      this.playerData = getDefaultPlayerData();
    } else {
      this.playerData = data.playerData;
    }
  }

  create(): void {
    // Set up camera
    this.cameras.main.setBackgroundColor(Colors.DARK_GREEN);
    this.cameras.main.fadeIn(500);

    // Create groups
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.obstacleLayer = this.physics.add.staticGroup();
    this.interactables = this.physics.add.staticGroup();
    this.itemDrops = this.physics.add.group();

    // Initialize room manager
    this.roomManager = new RoomManager(this);
    this.roomManager.onRoomChange = this.handleRoomChange.bind(this);
    this.roomManager.onTransitionStart = () => {
      // Disable player input during transition
      this.player.setActive(false);
    };
    this.roomManager.onTransitionEnd = () => {
      this.player.setActive(true);
    };

    // Create tilemap
    this.createTilemap();

    // Create player
    this.createPlayer();

    // Initialize dungeon mechanics
    this.dungeonMechanics = new DungeonMechanics(this, this.player);
    this.dungeonMechanics.onDoorOpen = this.handleDoorOpen.bind(this);
    this.dungeonMechanics.onPlayerFall = this.handlePlayerFall.bind(this);

    // Create combat system
    this.combatSystem = new CombatSystem(this, this.player, this.enemies, this.projectiles);

    // Spawn test enemies
    this.spawnTestEnemies();

    // Spawn interactables
    this.spawnInteractables();

    // Set up collisions
    this.setupCollisions();

    // Set up input
    this.setupInput();

    // Launch UI scene
    this.scene.launch('UIScene', { playerData: this.playerData });

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // Listen for player death
    this.events.on('playerDeath', this.onPlayerDeath, this);

    // Listen for bomb explosions
    this.events.on('bombExplosion', this.handleBombExplosion, this);
  }

  private createTilemap(): void {
    // Generate map data (ported from pygame)
    this.mapData = [
      '################################################################################',
      '#..............................................................................#',
      '#..TTT....RR...................................................TTT....RR.......#',
      '#..TTT.........................................................TTT.............#',
      '#..............................................................................#',
      '#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.............#',
      '#.....P................................................................P.......#',
      '#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#',
      '#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#',
      '#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#',
      '#.....P................................................................P.......#',
      '#.....P................................................................P.......#',
      '#.....P...RR...........RR.........BBB........RR...........RR...........P.......#',
      '#.....P................................................................P.......#',
      '#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#',
      '#..............................................................................#',
      '#..TTT.............................TTT.............................TTT........#',
      '#..TTT.............................TTT.............................TTT........#',
      '#..............................................................................#',
      '#..........RR.....................................................RR...........#',
      '#..............................................................................#',
      '#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#',
      '#.....P................................................................P.......#',
      '#.....P................................................................P.......#',
      '#.....P...BBB..........BBB..........BBB..........BBB..........BBB......P.......#',
      '#.....P................................................................P.......#',
      '#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#',
      '#..............................................................................#',
      '#..............................................................................#',
      '################################################################################',
    ];

    // Create tiles from map data
    for (let row = 0; row < this.mapData.length; row++) {
      for (let col = 0; col < this.mapData[row].length; col++) {
        const char = this.mapData[row][col];
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        // Determine tile type and create sprite
        this.createTile(char, x, y);
      }
    }

    // Set world bounds based on map size
    const worldWidth = this.mapData[0].length * this.tileSize;
    const worldHeight = this.mapData.length * this.tileSize;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  private createTile(char: string, x: number, y: number): void {
    let textureKey: string;
    let isSolid = false;

    switch (char) {
      case '#':
        textureKey = 'tile_wall';
        isSolid = true;
        break;
      case '~':
        textureKey = 'tile_water';
        isSolid = true;
        break;
      case 'T':
        textureKey = 'tile_tree';
        isSolid = true;
        break;
      case 'R':
        textureKey = 'tile_rock';
        isSolid = true;
        break;
      case 'B':
        textureKey = 'tile_bush';
        isSolid = true;
        break;
      case 'P':
        textureKey = 'tile_path';
        break;
      default:
        textureKey = 'tile_grass';
    }

    // Create tile sprite
    const tile = this.add.sprite(x + this.tileSize / 2, y + this.tileSize / 2, textureKey);
    tile.setScale(SCALE);

    // Add collision for solid tiles
    if (isSolid) {
      const obstacle = this.obstacleLayer.create(x + this.tileSize / 2, y + this.tileSize / 2, textureKey);
      obstacle.setScale(SCALE);
      obstacle.setVisible(false); // Hide collision sprite (visual tile already rendered)
      obstacle.refreshBody();
    }
  }

  private createPlayer(): void {
    this.player = new Player(
      this,
      this.playerData.position.x,
      this.playerData.position.y,
      this.playerData
    );

    // Set up player callbacks
    this.player.onAttack = (player, damage, isSpinAttack) => {
      this.combatSystem.handlePlayerAttack(damage, isSpinAttack);
      // Also check interactables in attack range
      this.handlePlayerAttackInteractables(isSpinAttack);
    };

    this.player.onProjectile = (x, y, direction, type) => {
      this.createProjectile(x, y, direction, type, true);
    };

    this.player.onLampUse = (x, y, radius) => {
      this.dungeonMechanics.useLamp(x, y, radius);
    };

    this.player.onHammerUse = (x, y, direction) => {
      this.handleHammerUse(x, y, direction);
    };
  }

  private spawnTestEnemies(): void {
    const enemySpawns = [
      { x: 400, y: 300, type: 'soldier_green' },
      { x: 600, y: 400, type: 'octorok' },
      { x: 200, y: 500, type: 'keese' },
      { x: 500, y: 200, type: 'stalfos' },
      { x: 700, y: 300, type: 'moblin' },
      { x: 300, y: 600, type: 'soldier_blue' },
    ];

    enemySpawns.forEach((spawn) => {
      this.spawnEnemy(spawn.x, spawn.y, spawn.type);
    });
  }

  private spawnEnemy(x: number, y: number, type: string): void {
    const enemy = new Enemy(this, x, y, type, this.player);
    this.enemies.add(enemy as unknown as Phaser.Physics.Arcade.Sprite);

    // Set up enemy projectile callback
    enemy.onProjectile = (ex, ey, direction, projType) => {
      this.createProjectile(ex, ey, direction, projType, false);
    };

    // Set up enemy death callback for drops
    enemy.onDeath = (deadEnemy) => {
      const drop = ItemDrop.spawnFromEnemy(this, deadEnemy.x, deadEnemy.y);
      if (drop) {
        this.itemDrops.add(drop);
      }
    };
  }

  private spawnInteractables(): void {
    // Spawn some cuttable grass
    const grassPositions = [
      { x: 150, y: 200 },
      { x: 200, y: 200 },
      { x: 250, y: 200 },
      { x: 150, y: 250 },
      { x: 500, y: 400 },
      { x: 550, y: 400 },
      { x: 600, y: 450 },
      { x: 300, y: 550 },
      { x: 350, y: 550 },
    ];

    grassPositions.forEach(pos => {
      this.spawnInteractable(pos.x, pos.y, 'grass');
    });

    // Spawn some pots
    const potPositions = [
      { x: 400, y: 150 },
      { x: 450, y: 150 },
      { x: 600, y: 250 },
    ];

    potPositions.forEach(pos => {
      this.spawnInteractable(pos.x, pos.y, 'pot');
    });

    // Spawn a chest
    this.spawnInteractable(700, 500, 'chest', 'key');
  }

  private spawnInteractable(x: number, y: number, type: InteractableType, contents?: string): Interactable {
    const interactable = new Interactable(this, x, y, type, contents);
    this.interactables.add(interactable as unknown as Phaser.Physics.Arcade.Sprite);

    // Set up callbacks
    interactable.onDrop = (dropX, dropY, dropType) => {
      this.spawnItemDrop(dropX, dropY, dropType as DropType);
    };

    interactable.onDestroy = (destroyed) => {
      // Remove from group
    };

    interactable.onActivate = (activated) => {
      // Handle switch/pressure plate activation
      if (activated.interactableType === 'switch' || activated.interactableType === 'pressure_plate') {
        this.dungeonMechanics.activateSwitch(
          `${activated.interactableType}_${activated.x}_${activated.y}`,
          activated.isActivated
        );
      }
    };

    return interactable;
  }

  private spawnItemDrop(x: number, y: number, dropType: DropType): void {
    const drop = ItemDrop.spawn(this, x, y, dropType);
    this.itemDrops.add(drop);
  }

  private handlePlayerAttackInteractables(isSpinAttack: boolean): void {
    const hitbox = isSpinAttack ? this.player.getSpinAttackHitbox() : this.player.getAttackHitbox();

    this.interactables.getChildren().forEach(obj => {
      const interactable = obj as unknown as Interactable;
      if (interactable.isDestroyed) return;

      const interactBounds = new Phaser.Geom.Rectangle(
        interactable.x - this.tileSize / 2,
        interactable.y - this.tileSize / 2,
        this.tileSize,
        this.tileSize
      );

      if (Phaser.Geom.Rectangle.Overlaps(hitbox, interactBounds)) {
        interactable.interact('sword', this.player.facing, this.playerData.items.glove);
      }
    });
  }

  private handleHammerUse(x: number, y: number, direction: Direction): void {
    // Check for interactables in hammer range
    this.interactables.getChildren().forEach(obj => {
      const interactable = obj as unknown as Interactable;
      if (interactable.isDestroyed) return;

      const distance = Phaser.Math.Distance.Between(x, y, interactable.x, interactable.y);
      if (distance < this.tileSize * 1.5) {
        interactable.interact('hammer', direction, this.playerData.items.glove);
      }
    });

    // TODO: Check for cracked floors, pegs, etc.
  }

  private handleRoomChange(oldRoom: string, newRoom: string, roomData: RoomData): void {
    // Clear current room entities
    this.clearRoom();

    // Load new room
    this.loadRoom(roomData);
  }

  private clearRoom(): void {
    // Clear enemies
    this.enemies.clear(true, true);

    // Clear interactables
    this.interactables.clear(true, true);

    // Clear item drops
    this.itemDrops.clear(true, true);

    // Clear tile sprites
    this.tileSprites.forEach(sprite => sprite.destroy());
    this.tileSprites = [];

    // Clear obstacle layer
    this.obstacleLayer.clear(true, true);

    // Clear dungeon mechanics
    this.dungeonMechanics.cleanup();
  }

  private loadRoom(roomData: RoomData): void {
    // Set up darkness if needed
    this.dungeonMechanics.setupDarkRoom(roomData.darkRoom);

    // Create tilemap from room data
    for (let row = 0; row < roomData.map.length; row++) {
      for (let col = 0; col < roomData.map[row].length; col++) {
        const char = roomData.map[row][col];
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        this.createTile(char, x, y);
      }
    }

    // Spawn enemies
    roomData.enemies.forEach(enemyData => {
      this.spawnEnemy(enemyData.x, enemyData.y, enemyData.type);
    });

    // Spawn interactables
    roomData.interactables.forEach(intData => {
      this.spawnInteractable(intData.x, intData.y, intData.type as InteractableType, intData.contents);
    });

    // Set world bounds
    const worldWidth = roomData.map[0].length * this.tileSize;
    const worldHeight = roomData.map.length * this.tileSize;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  private handleDoorOpen(doorId: string): void {
    // Find and remove the door interactable
    this.interactables.getChildren().forEach(obj => {
      const interactable = obj as unknown as Interactable;
      if (interactable.interactableType === 'locked_door' || interactable.interactableType === 'boss_door') {
        this.dungeonMechanics.openLockedDoor(interactable);
      }
    });
  }

  private handlePlayerFall(targetRoom: string, targetX: number, targetY: number, damage: number): void {
    // Transition to target room
    const door: DoorData = {
      x: this.player.x,
      y: this.player.y,
      direction: Direction.DOWN,
      targetRoom,
      targetX,
      targetY
    };

    this.roomManager.transitionToRoom(door, false, false, (success) => {
      if (success) {
        this.player.x = targetX;
        this.player.y = targetY;
      }
    });
  }

  private handleBombExplosion(x: number, y: number, damage: number): void {
    // Damage nearby enemies
    this.enemies.getChildren().forEach(obj => {
      const enemy = obj as unknown as Enemy;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < this.tileSize * 2) {
        enemy.takeDamage(damage, x, y);
      }
    });

    // Destroy nearby interactables
    this.interactables.getChildren().forEach(obj => {
      const interactable = obj as unknown as Interactable;
      const distance = Phaser.Math.Distance.Between(x, y, interactable.x, interactable.y);
      if (distance < this.tileSize * 2) {
        interactable.interact('bomb', this.player.facing, this.playerData.items.glove);
      }
    });

    // Damage player if nearby
    const playerDistance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (playerDistance < this.tileSize * 1.5) {
      this.player.takeDamage(damage / 2, x, y);
    }
  }

  private createProjectile(x: number, y: number, direction: Direction, type: string, isPlayerProjectile: boolean): void {
    const projectile = new Projectile(this, x, y, direction, type, isPlayerProjectile);
    this.projectiles.add(projectile as unknown as Phaser.Physics.Arcade.Sprite);
  }

  private setupCollisions(): void {
    // Player vs obstacles
    this.physics.add.collider(this.player, this.obstacleLayer);

    // Enemies vs obstacles
    this.physics.add.collider(this.enemies, this.obstacleLayer);

    // Player vs enemies (handled by combat system)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (player, enemy) => {
        this.combatSystem.handlePlayerEnemyCollision(enemy as unknown as Enemy);
      },
      undefined,
      this
    );

    // Projectiles vs obstacles
    this.physics.add.collider(
      this.projectiles,
      this.obstacleLayer,
      (projectile) => {
        (projectile as Projectile).onHitObstacle();
      },
      undefined,
      this
    );

    // Player projectiles vs enemies
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (projectile, enemy) => {
        const proj = projectile as unknown as Projectile;
        if (proj.isPlayerProjectile) {
          this.combatSystem.handleProjectileHit(proj, enemy as unknown as Enemy);
        }
      },
      undefined,
      this
    );

    // Enemy projectiles vs player
    this.physics.add.overlap(
      this.player,
      this.projectiles,
      (player, projectile) => {
        const proj = projectile as unknown as Projectile;
        if (!proj.isPlayerProjectile) {
          this.combatSystem.handleEnemyProjectileHit(proj);
        }
      },
      undefined,
      this
    );
  }

  private setupInput(): void {
    this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.inventoryKey2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.actionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    this.pauseKey.on('down', () => this.pauseGame());
    this.inventoryKey.on('down', () => this.openInventory());
    this.inventoryKey2.on('down', () => this.openInventory());
    this.actionKey.on('down', () => this.handleAction());
  }

  private handleAction(): void {
    // Handle lifting/throwing objects, reading signs, opening chests, etc.
    if (this.player.isCarrying) {
      // Throw carried object
      const carriedObj = this.player.carriedObject;
      this.player.throwCarriedObject();

      // Find the interactable and throw it
      if (carriedObj) {
        this.interactables.getChildren().forEach(obj => {
          const interactable = obj as unknown as Interactable;
          if (interactable.isLifted) {
            interactable.throw(this.player.facing, this.player);
          }
        });
      }
    } else {
      // Try to interact with nearby objects
      const interactionRange = this.tileSize * 1.2;
      let closestInteractable: Interactable | null = null;
      let closestDistance = interactionRange;

      this.interactables.getChildren().forEach(obj => {
        const interactable = obj as unknown as Interactable;
        if (interactable.isDestroyed) return;

        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          interactable.x,
          interactable.y
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestInteractable = interactable;
        }
      });

      if (closestInteractable) {
        const interactable = closestInteractable as Interactable;

        // Handle different interaction types
        if (interactable.interactableType === 'pot' || interactable.interactableType === 'rock') {
          if (interactable.canInteract('lift', this.playerData.items.glove)) {
            interactable.lift();
            this.player.liftObject(interactable);
          }
        } else if (interactable.interactableType === 'chest') {
          interactable.interact('open', this.player.facing, this.playerData.items.glove);
        } else if (interactable.interactableType === 'switch') {
          interactable.interact('press', this.player.facing, this.playerData.items.glove);
        } else if (interactable.interactableType === 'locked_door') {
          if (this.playerData.keys > 0) {
            this.playerData.keys--;
            interactable.interact('key', this.player.facing, this.playerData.items.glove);
          }
        } else if (interactable.interactableType === 'boss_door') {
          // Check if player has boss key for current dungeon
          const currentRoom = this.roomManager.getCurrentRoom();
          if (currentRoom && this.playerData.bossKeys.includes(currentRoom.id)) {
            interactable.interact('boss_key', this.player.facing, this.playerData.items.glove);
          }
        }
      }
    }
  }

  private pauseGame(): void {
    this.scene.pause();
    this.scene.launch('PauseScene', { playerData: this.playerData });
  }

  private openInventory(): void {
    this.scene.pause();
    this.scene.launch('InventoryScene', { playerData: this.playerData });
  }

  private onPlayerDeath(): void {
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene', { playerData: this.playerData });
  }

  update(time: number, delta: number): void {
    // Update player
    this.player.update(time, delta);

    // Update enemies
    this.enemies.getChildren().forEach((enemy) => {
      (enemy as unknown as Enemy).update(time, delta);
    });

    // Update projectiles
    this.projectiles.getChildren().forEach((projectile) => {
      (projectile as unknown as Projectile).update(time, delta);
    });

    // Update interactables
    this.interactables.getChildren().forEach((obj) => {
      (obj as unknown as Interactable).update(time, delta);
    });

    // Update item drops
    this.itemDrops.getChildren().forEach((obj) => {
      (obj as unknown as ItemDrop).update(time, delta);
    });

    // Update combat system
    this.combatSystem.update(time, delta);

    // Update dungeon mechanics
    this.dungeonMechanics.update(time, delta);

    // Check room transitions
    this.checkRoomTransition();

    // Check item drop collection
    this.checkItemCollection();

    // Update play time
    this.playerData.playTime += delta / 1000;

    // Emit player data update for UI
    this.events.emit('playerDataUpdate', this.playerData);
  }

  private checkRoomTransition(): void {
    if (this.roomManager.isInTransition()) return;

    const door = this.roomManager.checkRoomTransition(
      this.player.x,
      this.player.y,
      this.player.facing
    );

    if (door) {
      const hasKey = this.playerData.keys > 0;
      const currentRoom = this.roomManager.getCurrentRoom();
      const hasBossKey = currentRoom ? this.playerData.bossKeys.includes(currentRoom.id) : false;

      this.roomManager.transitionToRoom(door, hasKey, hasBossKey, (success, needsKey, needsBossKey) => {
        if (success) {
          // Move player to target position
          this.player.x = door.targetX;
          this.player.y = door.targetY;

          // Consume key if door was locked
          if (door.locked) {
            this.playerData.keys--;
          }
        } else if (needsKey) {
          // Show "locked" feedback
          this.showMessage('This door is locked!');
        } else if (needsBossKey) {
          this.showMessage('You need the Big Key!');
        }
      });
    }
  }

  private checkItemCollection(): void {
    this.itemDrops.getChildren().forEach((obj) => {
      const drop = obj as unknown as ItemDrop;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.x, drop.y);

      if (distance < this.tileSize * 0.8) {
        const result = drop.collect();
        if (result) {
          this.applyDropEffect(result.type, result.value);
        }
      }
    });
  }

  private applyDropEffect(type: string, value: number): void {
    switch (type) {
      case 'health':
        this.player.heal(value);
        break;
      case 'rupees':
        this.playerData.rupees += value;
        break;
      case 'bombs':
        this.playerData.bombs = Math.min(this.playerData.bombs + value, 99);
        break;
      case 'arrows':
        this.playerData.arrows = Math.min(this.playerData.arrows + value, 99);
        break;
      case 'magic':
        this.player.restoreMagic(value);
        break;
      case 'key':
        this.playerData.keys++;
        break;
      case 'boss_key':
        const currentRoom = this.roomManager.getCurrentRoom();
        if (currentRoom && !this.playerData.bossKeys.includes(currentRoom.id)) {
          this.playerData.bossKeys.push(currentRoom.id);
        }
        break;
      case 'map':
        const mapRoom = this.roomManager.getCurrentRoom();
        if (mapRoom && !this.playerData.maps.includes(mapRoom.id)) {
          this.playerData.maps.push(mapRoom.id);
        }
        break;
      case 'compass':
        const compassRoom = this.roomManager.getCurrentRoom();
        if (compassRoom && !this.playerData.compasses.includes(compassRoom.id)) {
          this.playerData.compasses.push(compassRoom.id);
        }
        break;
      case 'fairy':
        // Full health restore
        this.player.heal(this.player.maxHealth);
        break;
      case 'heart_piece':
        this.playerData.heartPieces++;
        if (this.playerData.heartPieces >= 4) {
          this.playerData.heartPieces -= 4;
          this.playerData.maxHealth += 2;
          this.player.maxHealth += 2;
          this.player.heal(2);
        }
        break;
    }
  }

  private showMessage(text: string): void {
    // Simple message display
    const message = this.add.text(
      this.cameras.main.scrollX + SCREEN_WIDTH / 2,
      this.cameras.main.scrollY + SCREEN_HEIGHT - 50,
      text,
      { fontSize: '16px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } }
    );
    message.setOrigin(0.5);
    message.setDepth(2000);

    this.time.delayedCall(2000, () => {
      message.destroy();
    });
  }

  // Called when resuming from pause
  resume(): void {
    this.cameras.main.fadeIn(200);
  }

  // Cleanup event listeners to prevent memory leaks
  shutdown(): void {
    this.events.off('playerDeath', this.onPlayerDeath, this);
    this.events.off('bombExplosion', this.handleBombExplosion, this);
  }
}
