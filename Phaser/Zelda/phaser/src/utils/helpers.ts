// Utility helper functions

import { Direction } from '../config';

/**
 * Get the opposite direction
 */
export function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.UP: return Direction.DOWN;
    case Direction.DOWN: return Direction.UP;
    case Direction.LEFT: return Direction.RIGHT;
    case Direction.RIGHT: return Direction.LEFT;
  }
}

/**
 * Get direction name as string
 */
export function getDirectionName(direction: Direction): string {
  switch (direction) {
    case Direction.UP: return 'up';
    case Direction.DOWN: return 'down';
    case Direction.LEFT: return 'left';
    case Direction.RIGHT: return 'right';
  }
}

/**
 * Convert angle to direction
 */
export function angleToDirection(angle: number): Direction {
  // Handle NaN input
  if (isNaN(angle)) {
    return Direction.DOWN;
  }
  // Normalize angle to 0-360
  const normalized = ((angle * 180 / Math.PI) + 360) % 360;

  if (normalized >= 315 || normalized < 45) {
    return Direction.RIGHT;
  } else if (normalized >= 45 && normalized < 135) {
    return Direction.DOWN;
  } else if (normalized >= 135 && normalized < 225) {
    return Direction.LEFT;
  } else {
    return Direction.UP;
  }
}

/**
 * Format time in seconds to HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
export function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return undefined;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array in place
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
