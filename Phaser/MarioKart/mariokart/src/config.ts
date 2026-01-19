// Display Settings
export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;

// Kart Physics
export const KART_MAX_SPEED = 50;
export const KART_ACCELERATION = 25;
export const KART_BRAKE_FORCE = 35;
export const KART_TURN_SPEED = 2.5;
export const KART_DRIFT_MULTIPLIER = 1.8;
export const KART_FRICTION = 0.98;
export const KART_MASS = 100;
export const KART_BOUNCE_FACTOR = 0.3;

// Kart Dimensions
export const KART_WIDTH = 1.5;
export const KART_HEIGHT = 0.8;
export const KART_DEPTH = 2.5;

// Race Settings
export const TOTAL_LAPS = 3;
export const AI_KART_COUNT = 7;
export const COUNTDOWN_SECONDS = 3;
export const CHECKPOINT_COUNT = 8;

// Track Settings
export const TRACK_WIDTH = 18;
export const TRACK_LENGTH = 120;
export const TRACK_CURVE_RADIUS = 35;
export const WALL_HEIGHT = 2;
export const WALL_THICKNESS = 1;

// Items
export const ITEM_BOX_RESPAWN_TIME = 10000;
export const MUSHROOM_BOOST_SPEED = 80;
export const MUSHROOM_BOOST_DURATION = 1500;
export const SHELL_SPEED = 60;
export const STAR_DURATION = 8000;
export const STUN_DURATION = 2000;

export enum ItemType {
  NONE = 'none',
  MUSHROOM = 'mushroom',
  GREEN_SHELL = 'green_shell',
  RED_SHELL = 'red_shell',
  BANANA = 'banana',
  STAR = 'star',
}

// Item drop chances (must sum to 1.0)
export const ITEM_DROP_CHANCES: Record<ItemType, number> = {
  [ItemType.NONE]: 0,
  [ItemType.MUSHROOM]: 0.35,
  [ItemType.GREEN_SHELL]: 0.25,
  [ItemType.RED_SHELL]: 0.15,
  [ItemType.BANANA]: 0.20,
  [ItemType.STAR]: 0.05,
};

// Controls
export const Controls = {
  ACCELERATE: ['W', 'UP'],
  BRAKE: ['S', 'DOWN'],
  STEER_LEFT: ['A', 'LEFT'],
  STEER_RIGHT: ['D', 'RIGHT'],
  DRIFT: ['SPACE'],
  USE_ITEM: ['Z', 'SHIFT'],
  LOOK_BACK: ['X'],
  PAUSE: ['ESC'],
};

// Camera Settings
export const CAMERA_DISTANCE = 12;
export const CAMERA_HEIGHT = 5;
export const CAMERA_SMOOTHING = 0.08;
export const CAMERA_LOOK_AHEAD = 5;

// AI Settings
export const AI_DIFFICULTY = {
  easy: { speedMultiplier: 0.80, reactionTime: 400, mistakeChance: 0.12 },
  medium: { speedMultiplier: 0.92, reactionTime: 250, mistakeChance: 0.06 },
  hard: { speedMultiplier: 1.0, reactionTime: 150, mistakeChance: 0.02 },
};

export type Difficulty = keyof typeof AI_DIFFICULTY;

// Colors
export const Colors = {
  TRACK: 0x444444,
  TRACK_EDGE: 0xffffff,
  GRASS: 0x2d5a27,
  WALL: 0x888888,
  SKY: 0x87ceeb,
  KART_PLAYER: 0xff0000,
  KART_AI_COLORS: [0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff],
  ITEM_BOX: 0xffcc00,
  CHECKPOINT: 0x00ff00,
};

// UI Settings
export const UI_FONT_SIZE = 24;
export const UI_PADDING = 20;
