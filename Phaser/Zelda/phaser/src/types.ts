// TypeScript interfaces and types for Zelda clone

import { Direction } from './config';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerItems {
  sword: 'none' | 'fighter' | 'master' | 'tempered' | 'golden';
  shield: 'none' | 'small' | 'fire' | 'mirror';
  armor: 'green' | 'blue' | 'red';
  bow: boolean;
  boomerang: 'none' | 'normal' | 'magic';
  hookshot: boolean;
  bombs: boolean;
  mushroom: boolean;
  powder: boolean;
  fire_rod: boolean;
  ice_rod: boolean;
  bombos: boolean;
  ether: boolean;
  quake: boolean;
  lamp: boolean;
  hammer: boolean;
  flute: boolean;
  net: boolean;
  book: boolean;
  bottles: string[];
  cane_somaria: boolean;
  cane_byrna: boolean;
  cape: boolean;
  mirror: boolean;
  glove: 'none' | 'power' | 'titan';
  boots: boolean;
  flippers: boolean;
  pearl: boolean;
}

export interface PlayerData {
  health: number;
  maxHealth: number;
  magic: number;
  maxMagic: number;
  rupees: number;
  bombs: number;
  arrows: number;
  keys: number;
  position: Position;
  direction: Direction;
  currentWorld: 'light' | 'dark';
  currentMap: string;
  currentRoom: [number, number];
  items: PlayerItems;
  equippedItem: string;
  dungeonsCompleted: string[];
  bossKeys: string[];
  maps: string[];
  compasses: string[];
  heartPieces: number;
  playTime: number;
}

export interface EnemyData {
  type: string;
  x: number;
  y: number;
}

export interface TileData {
  type: string;
  solid: boolean;
}

export type GameState = 'title' | 'playing' | 'paused' | 'inventory' | 'game_over' | 'save_menu';

export interface SaveData {
  playerData: PlayerData;
  timestamp: number;
}

// Default player data factory
export function getDefaultPlayerData(): PlayerData {
  return {
    health: 12,  // 6 hearts * 2 HP
    maxHealth: 12,
    magic: 32,
    maxMagic: 32,
    rupees: 0,
    bombs: 0,
    arrows: 0,
    keys: 0,
    position: { x: 384, y: 336 },  // Center of screen
    direction: Direction.DOWN,
    currentWorld: 'light',
    currentMap: 'overworld',
    currentRoom: [8, 8],
    items: {
      sword: 'fighter',
      shield: 'small',
      armor: 'green',
      bow: false,
      boomerang: 'normal',
      hookshot: false,
      bombs: true,
      mushroom: false,
      powder: false,
      fire_rod: false,
      ice_rod: false,
      bombos: false,
      ether: false,
      quake: false,
      lamp: true,
      hammer: false,
      flute: false,
      net: false,
      book: false,
      bottles: [],
      cane_somaria: false,
      cane_byrna: false,
      cape: false,
      mirror: false,
      glove: 'none',
      boots: false,
      flippers: false,
      pearl: false,
    },
    equippedItem: 'bombs',
    dungeonsCompleted: [],
    bossKeys: [],
    maps: [],
    compasses: [],
    heartPieces: 0,
    playTime: 0,
  };
}
