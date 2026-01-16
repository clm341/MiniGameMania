// Game Settings for Zelda: A Link to the Past Clone
// Ported from pygame settings.py

// Display settings (SNES was 256x224, we scale up for modern displays)
export const TILE_SIZE = 16;
export const SCALE = 3;
export const SCREEN_WIDTH = 256 * SCALE;  // 768
export const SCREEN_HEIGHT = 224 * SCALE; // 672
export const FPS = 60;

// Colors (as hex numbers for Phaser)
export const Colors = {
  BLACK: 0x000000,
  WHITE: 0xffffff,
  RED: 0xff0000,
  GREEN: 0x00ff00,
  BLUE: 0x0000ff,
  YELLOW: 0xffff00,
  DARK_GREEN: 0x228b22,
  LIGHT_BLUE: 0x87ceeb,
  DARK_BLUE: 0x00008b,
  GOLD: 0xffd700,
  HEART_RED: 0xf83800,
  MAGIC_GREEN: 0x00a800,
};

// Player settings - LTTP Link moves ~1.5px/frame at 60fps, scaled 3x = ~270px/sec
export const PLAYER_SPEED = 180;  // Fast, snappy movement like original
export const PLAYER_HEALTH = 6;  // Hearts (each heart = 2 HP, so 12 HP total)
export const PLAYER_MAX_HEALTH = 20;
export const PLAYER_MAGIC = 32;
export const PLAYER_MAX_MAGIC = 128;

// Combat settings - faster, more responsive
export const SWORD_DAMAGE = 2;
export const SWORD_COOLDOWN = 150;  // Quick sword swings
export const SPIN_ATTACK_CHARGE_TIME = 600;  // Faster charge
export const SPIN_ATTACK_DAMAGE = 4;
export const INVINCIBILITY_DURATION = 500;  // Shorter i-frames

// Item damage values
export const ITEM_DAMAGE: Record<string, number> = {
  sword: 2,
  master_sword: 4,
  tempered_sword: 6,
  golden_sword: 12,
  arrow: 4,
  silver_arrow: 8,
  bomb: 8,
  boomerang: 0,  // stuns enemies
  magic_boomerang: 2,
  hookshot: 2,
  fire_rod: 8,
  ice_rod: 8,
  hammer: 4,
};

// Item magic costs
export const ITEM_MAGIC_COST: Record<string, number> = {
  fire_rod: 4,
  ice_rod: 4,
  bombos: 8,
  ether: 8,
  quake: 8,
  magic_cape: 1,
  cane_of_byrna: 1,
  cane_of_somaria: 2,
};

// Enemy settings
export interface EnemyStats {
  health: number;
  damage: number;
  speed: number;
  behavior: string;
}

// Enemy speeds are multiplied by SCALE in Enemy.ts, so these are base speeds
export const ENEMY_TYPES: Record<string, EnemyStats> = {
  soldier_green: { health: 4, damage: 2, speed: 60, behavior: 'patrol' },
  soldier_blue: { health: 6, damage: 2, speed: 80, behavior: 'chase' },
  octorok: { health: 2, damage: 2, speed: 50, behavior: 'shoot' },
  moblin: { health: 6, damage: 4, speed: 55, behavior: 'throw' },
  keese: { health: 1, damage: 1, speed: 120, behavior: 'fly' },
  stalfos: { health: 4, damage: 2, speed: 65, behavior: 'wander' },
  rope: { health: 2, damage: 2, speed: 200, behavior: 'charge' },
  tektite: { health: 2, damage: 2, speed: 100, behavior: 'jump' },
  armos: { health: 6, damage: 2, speed: 40, behavior: 'awaken' },
  buzzblob: { health: 2, damage: 2, speed: 30, behavior: 'electric' },
};

// Animation settings - faster for snappier feel
export const ANIMATION_SPEED = 60;  // milliseconds per frame

// Map/World settings
export const WORLD_WIDTH = 16;  // screens wide
export const WORLD_HEIGHT = 16; // screens tall
export const ROOM_WIDTH = 16;   // tiles per room width
export const ROOM_HEIGHT = 14;  // tiles per room height (minus HUD space)

// HUD settings
export const HUD_HEIGHT = 56 * SCALE;

// Directions
export enum Direction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
};

// Controls
export const Controls = {
  UP: ['W', 'UP'],
  DOWN: ['S', 'DOWN'],
  LEFT: ['A', 'LEFT'],
  RIGHT: ['D', 'RIGHT'],
  SWORD: ['J', 'Z'],
  ITEM: ['K', 'X'],
  ACTION: ['L', 'C'],
  INVENTORY: ['I', 'ENTER'],
  PAUSE: ['ESC'],
};
