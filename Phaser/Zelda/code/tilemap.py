"""
TileMap system - handles loading, rendering, and collision for tile-based maps.
"""

import pygame
import json
import os
from settings import *


class Tile(pygame.sprite.Sprite):
    """Individual tile sprite for collision."""

    def __init__(self, pos, groups, tile_type='solid'):
        super().__init__(groups)
        self.tile_type = tile_type
        self.image = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE))
        self.image.fill(self.get_color())
        self.rect = self.image.get_rect(topleft=pos)

    def get_color(self):
        """Get tile color based on type."""
        colors = {
            'solid': (100, 80, 60),      # Brown (walls)
            'water': BLUE,
            'pit': BLACK,
            'grass': DARK_GREEN,
            'floor': (180, 160, 140),    # Light tan
            'tree': (0, 100, 0),
            'rock': (128, 128, 128),
        }
        return colors.get(self.tile_type, DARK_GREEN)


class TileMap:
    def __init__(self, collision_group):
        self.collision_group = collision_group
        self.tiles = []
        self.tile_size = TILE_SIZE * SCALE

        # Tile graphics (procedurally generated for now)
        self.tile_images = self.create_tile_images()

        # Create a test map
        self.map_data = self.create_test_map()
        self.create_tiles()

    def create_tile_images(self):
        """Create placeholder tile images."""
        images = {}

        # Grass tile
        grass = pygame.Surface((self.tile_size, self.tile_size))
        grass.fill(DARK_GREEN)
        # Add some texture
        for i in range(0, self.tile_size, 8):
            for j in range(0, self.tile_size, 8):
                if (i + j) % 16 == 0:
                    pygame.draw.rect(grass, (45, 150, 45), (i, j, 4, 4))
        images['grass'] = grass

        # Wall/solid tile
        wall = pygame.Surface((self.tile_size, self.tile_size))
        wall.fill((100, 80, 60))
        pygame.draw.rect(wall, (80, 60, 40), (2, 2, self.tile_size - 4, self.tile_size - 4))
        images['wall'] = wall

        # Water tile
        water = pygame.Surface((self.tile_size, self.tile_size))
        water.fill(BLUE)
        pygame.draw.line(water, LIGHT_BLUE, (0, self.tile_size // 2),
                         (self.tile_size, self.tile_size // 2), 2)
        images['water'] = water

        # Floor tile (dungeon)
        floor = pygame.Surface((self.tile_size, self.tile_size))
        floor.fill((160, 140, 120))
        pygame.draw.rect(floor, (140, 120, 100), (0, 0, self.tile_size, 2))
        pygame.draw.rect(floor, (140, 120, 100), (0, 0, 2, self.tile_size))
        images['floor'] = floor

        # Tree tile
        tree = pygame.Surface((self.tile_size, self.tile_size))
        tree.fill(DARK_GREEN)
        pygame.draw.circle(tree, (0, 120, 0),
                           (self.tile_size // 2, self.tile_size // 2),
                           self.tile_size // 2 - 4)
        pygame.draw.rect(tree, (100, 50, 0),
                         (self.tile_size // 2 - 4, self.tile_size // 2,
                          8, self.tile_size // 2))
        images['tree'] = tree

        # Rock tile
        rock = pygame.Surface((self.tile_size, self.tile_size))
        rock.fill(DARK_GREEN)
        pygame.draw.circle(rock, (128, 128, 128),
                           (self.tile_size // 2, self.tile_size // 2),
                           self.tile_size // 2 - 2)
        pygame.draw.circle(rock, (160, 160, 160),
                           (self.tile_size // 2 - 4, self.tile_size // 2 - 4),
                           self.tile_size // 4)
        images['rock'] = rock

        # Bush tile
        bush = pygame.Surface((self.tile_size, self.tile_size))
        bush.fill(DARK_GREEN)
        pygame.draw.circle(bush, (0, 150, 0),
                           (self.tile_size // 2, self.tile_size // 2),
                           self.tile_size // 2 - 2)
        images['bush'] = bush

        # Path tile
        path = pygame.Surface((self.tile_size, self.tile_size))
        path.fill((200, 180, 140))
        images['path'] = path

        return images

    def create_test_map(self):
        """Create a test map layout."""
        # Map legend:
        # . = grass (walkable)
        # # = wall (solid)
        # ~ = water (solid)
        # T = tree (solid)
        # R = rock (solid)
        # B = bush (solid, cuttable)
        # P = path (walkable)

        map_layout = [
            "################################################################################",
            "#..............................................................................#",
            "#..TTT....RR...................................................TTT....RR.......#",
            "#..TTT.........................................................TTT.............#",
            "#..............................................................................#",
            "#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.............#",
            "#.....P................................................................P.......#",
            "#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#",
            "#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#",
            "#.....P...~~~~~~~~~~~~~~~.....................................~~~~....P.......#",
            "#.....P................................................................P.......#",
            "#.....P................................................................P.......#",
            "#.....P...RR...........RR.........BBB........RR...........RR...........P.......#",
            "#.....P................................................................P.......#",
            "#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#",
            "#..............................................................................#",
            "#..TTT.............................TTT.............................TTT........#",
            "#..TTT.............................TTT.............................TTT........#",
            "#..............................................................................#",
            "#..........RR.....................................................RR...........#",
            "#..............................................................................#",
            "#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#",
            "#.....P................................................................P.......#",
            "#.....P................................................................P.......#",
            "#.....P...BBB..........BBB..........BBB..........BBB..........BBB......P.......#",
            "#.....P................................................................P.......#",
            "#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.......#",
            "#..............................................................................#",
            "#..............................................................................#",
            "################################################################################",
        ]

        return map_layout

    def create_tiles(self):
        """Create tile sprites from map data."""
        self.tiles = []

        for row_index, row in enumerate(self.map_data):
            tile_row = []
            for col_index, tile_char in enumerate(row):
                x = col_index * self.tile_size
                y = row_index * self.tile_size

                # Determine tile type
                if tile_char == '#':
                    tile_type = 'wall'
                    Tile((x, y), [self.collision_group], 'solid')
                elif tile_char == '~':
                    tile_type = 'water'
                    Tile((x, y), [self.collision_group], 'water')
                elif tile_char == 'T':
                    tile_type = 'tree'
                    Tile((x, y), [self.collision_group], 'solid')
                elif tile_char == 'R':
                    tile_type = 'rock'
                    Tile((x, y), [self.collision_group], 'solid')
                elif tile_char == 'B':
                    tile_type = 'bush'
                    Tile((x, y), [self.collision_group], 'solid')
                elif tile_char == 'P':
                    tile_type = 'path'
                else:
                    tile_type = 'grass'

                tile_row.append(tile_type)
            self.tiles.append(tile_row)

    def draw(self, surface, camera):
        """Draw visible tiles."""
        # Guard against empty tilemap
        if not self.tiles or not self.tiles[0]:
            return

        # Calculate visible tile range
        start_col = max(0, int(camera.offset.x // self.tile_size))
        end_col = min(len(self.tiles[0]),
                      int((camera.offset.x + SCREEN_WIDTH) // self.tile_size) + 1)
        start_row = max(0, int(camera.offset.y // self.tile_size))
        end_row = min(len(self.tiles),
                      int((camera.offset.y + SCREEN_HEIGHT) // self.tile_size) + 1)

        for row in range(start_row, end_row):
            for col in range(start_col, end_col):
                if row < len(self.tiles) and col < len(self.tiles[row]):
                    tile_type = self.tiles[row][col]
                    tile_image = self.tile_images.get(tile_type, self.tile_images['grass'])

                    x = col * self.tile_size - camera.offset.x
                    y = row * self.tile_size - camera.offset.y

                    surface.blit(tile_image, (x, y))

    def load_map(self, map_file):
        """Load map from JSON file."""
        try:
            with open(map_file, 'r') as f:
                data = json.load(f)
            self.map_data = data.get('layout', self.map_data)
            self.create_tiles()
        except FileNotFoundError:
            print(f"Map file not found: {map_file}")
        except json.JSONDecodeError:
            print(f"Invalid map file: {map_file}")

    def save_map(self, map_file):
        """Save current map to JSON file."""
        data = {
            'layout': self.map_data,
            'width': len(self.map_data[0]) if self.map_data else 0,
            'height': len(self.map_data),
        }
        with open(map_file, 'w') as f:
            json.dump(data, f, indent=2)
