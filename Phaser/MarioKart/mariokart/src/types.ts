import { ItemType, Difficulty } from './config';

// Re-export types from config for convenience
export type { Difficulty };

// Vector types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

// Input types
export interface KartInput {
  accelerate: boolean;
  brake: boolean;
  steer: number; // -1 (left) to 1 (right)
  drift: boolean;
  useItem: boolean;
  lookBack: boolean;
}

// Kart state
export interface KartState {
  id: string;
  position: Vector3;
  rotation: number;
  speed: number;
  lap: number;
  checkpoint: number;
  item: ItemType;
  isInvincible: boolean;
  isStunned: boolean;
  isBoosting: boolean;
  isDrifting: boolean;
  driftCharge: number;
  finishTime: number | null;
}

// Race state
export interface RaceState {
  isCountdown: boolean;
  isStarted: boolean;
  isFinished: boolean;
  countdown: number;
  raceTime: number;
  positions: RacerPosition[];
}

export interface RacerPosition {
  id: string;
  position: number; // 1st, 2nd, etc.
  lap: number;
  checkpoint: number;
  distanceToNextCheckpoint: number;
  isPlayer: boolean;
  finishTime: number | null;
}

// Track types
export interface TrackSegment {
  type: 'straight' | 'curve';
  length?: number;
  radius?: number;
  angle?: number;
  direction?: 'left' | 'right';
}

export interface Checkpoint {
  position: Vector3;
  rotation: number;
  width: number;
  index: number;
}

export interface TrackData {
  segments: TrackSegment[];
  checkpoints: Checkpoint[];
  startPositions: Vector3[];
  itemBoxPositions: Vector3[];
  waypoints: Vector3[];
}

// Item types
export interface ActiveItem {
  type: ItemType;
  position: Vector3;
  velocity: Vector3;
  ownerId: string;
  createdAt: number;
}

export interface ItemBox {
  position: Vector3;
  isActive: boolean;
  respawnTime: number;
}

// Game settings
export interface GameSettings {
  difficulty: Difficulty;
  laps: number;
  aiCount: number;
}

// Results
export interface RaceResult {
  position: number;
  id: string;
  isPlayer: boolean;
  finishTime: number | null;
  bestLapTime: number | null;
}

// Scene data passing
export interface RaceSceneData {
  settings: GameSettings;
}

export interface ResultsSceneData {
  results: RaceResult[];
  raceTime: number;
}

// Utility type for keyboard state
export type KeyState = Record<string, boolean>;
