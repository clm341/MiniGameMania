"""
Camera system - handles viewport and scrolling.
"""

import pygame
from settings import *


class Camera:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.offset = pygame.math.Vector2(0, 0)

        # Camera bounds (for limiting to world size)
        self.world_width = WORLD_WIDTH * ROOM_WIDTH * TILE_SIZE * SCALE
        self.world_height = WORLD_HEIGHT * ROOM_HEIGHT * TILE_SIZE * SCALE

    def update(self, target):
        """Update camera position to follow target (player)."""
        # Center camera on target
        self.offset.x = target.rect.centerx - self.width // 2
        self.offset.y = target.rect.centery - self.height // 2

        # Clamp to world bounds
        self.offset.x = max(0, min(self.offset.x, self.world_width - self.width))
        self.offset.y = max(0, min(self.offset.y, self.world_height - self.height))

    def apply(self, rect):
        """Apply camera offset to a rect."""
        return rect.move(-self.offset.x, -self.offset.y)

    def apply_pos(self, pos):
        """Apply camera offset to a position tuple."""
        return (pos[0] - self.offset.x, pos[1] - self.offset.y)

    def reverse_apply(self, pos):
        """Convert screen position to world position."""
        return (pos[0] + self.offset.x, pos[1] + self.offset.y)
