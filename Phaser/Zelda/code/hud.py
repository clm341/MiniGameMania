"""
HUD (Heads-Up Display) - shows health, magic, items, rupees, etc.
"""

import pygame
from settings import *


class HUD:
    def __init__(self, player_data):
        self.player_data = player_data
        self.display_surface = pygame.display.get_surface()

        # Load/create HUD graphics
        self.heart_full = self.create_heart('full')
        self.heart_half = self.create_heart('half')
        self.heart_empty = self.create_heart('empty')

        self.magic_bar_width = 100

        # Fonts
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)

        # HUD dimensions
        self.hud_height = HUD_HEIGHT
        self.padding = 10

        # Item icons (placeholder)
        self.item_icons = self.create_item_icons()

    def create_heart(self, state):
        """Create a heart icon."""
        size = 16 * SCALE // 2
        surface = pygame.Surface((size, size), pygame.SRCALPHA)

        if state == 'full':
            color = HEART_RED
            pygame.draw.polygon(surface, color, [
                (size // 2, size - 2),
                (2, size // 3),
                (size // 4, 2),
                (size // 2, size // 4),
                (size * 3 // 4, 2),
                (size - 2, size // 3),
            ])
        elif state == 'half':
            # Left half red
            pygame.draw.polygon(surface, HEART_RED, [
                (size // 2, size - 2),
                (2, size // 3),
                (size // 4, 2),
                (size // 2, size // 4),
                (size // 2, size // 2),
            ])
            # Right half empty
            pygame.draw.polygon(surface, (100, 100, 100), [
                (size // 2, size - 2),
                (size // 2, size // 4),
                (size * 3 // 4, 2),
                (size - 2, size // 3),
            ])
        else:  # empty
            pygame.draw.polygon(surface, (100, 100, 100), [
                (size // 2, size - 2),
                (2, size // 3),
                (size // 4, 2),
                (size // 2, size // 4),
                (size * 3 // 4, 2),
                (size - 2, size // 3),
            ])

        return surface

    def create_item_icons(self):
        """Create placeholder item icons."""
        icons = {}
        size = 24

        items = ['bombs', 'bow', 'boomerang', 'hookshot', 'lamp',
                 'hammer', 'fire_rod', 'ice_rod', 'net', 'shovel']

        colors = {
            'bombs': BLACK,
            'bow': (139, 69, 19),
            'boomerang': BLUE,
            'hookshot': (139, 69, 19),
            'lamp': YELLOW,
            'hammer': (100, 100, 100),
            'fire_rod': RED,
            'ice_rod': LIGHT_BLUE,
            'net': GREEN,
            'shovel': (139, 69, 19),
        }

        for item in items:
            surface = pygame.Surface((size, size), pygame.SRCALPHA)
            color = colors.get(item, WHITE)
            pygame.draw.rect(surface, color, (4, 4, size - 8, size - 8))
            pygame.draw.rect(surface, WHITE, (4, 4, size - 8, size - 8), 1)
            icons[item] = surface

        return icons

    def draw_hearts(self, x, y):
        """Draw the health hearts."""
        health = self.player_data['health']
        max_health = self.player_data['max_health']

        heart_size = self.heart_full.get_width()
        hearts_per_row = 10

        total_hearts = max_health // 2  # Each heart represents 2 HP

        for i in range(total_hearts):
            row = i // hearts_per_row
            col = i % hearts_per_row

            heart_x = x + col * (heart_size + 2)
            heart_y = y + row * (heart_size + 2)

            hp_for_heart = (i + 1) * 2

            if health >= hp_for_heart:
                self.display_surface.blit(self.heart_full, (heart_x, heart_y))
            elif health >= hp_for_heart - 1:
                self.display_surface.blit(self.heart_half, (heart_x, heart_y))
            else:
                self.display_surface.blit(self.heart_empty, (heart_x, heart_y))

    def draw_magic_bar(self, x, y):
        """Draw the magic meter."""
        magic = self.player_data['magic']
        max_magic = self.player_data['max_magic']

        # Background
        pygame.draw.rect(self.display_surface, (50, 50, 50),
                         (x, y, self.magic_bar_width, 12))

        # Fill (guard against division by zero)
        if max_magic > 0:
            fill_width = int((magic / max_magic) * (self.magic_bar_width - 4))
        else:
            fill_width = 0
        pygame.draw.rect(self.display_surface, MAGIC_GREEN,
                         (x + 2, y + 2, fill_width, 8))

        # Border
        pygame.draw.rect(self.display_surface, WHITE,
                         (x, y, self.magic_bar_width, 12), 1)

        # Label
        label = self.small_font.render("MP", True, WHITE)
        self.display_surface.blit(label, (x - 25, y))

    def draw_rupees(self, x, y):
        """Draw rupee counter."""
        # Rupee icon (green gem)
        pygame.draw.polygon(self.display_surface, GREEN, [
            (x + 6, y),
            (x + 12, y + 8),
            (x + 6, y + 16),
            (x, y + 8),
        ])

        # Amount
        rupees = self.player_data['rupees']
        text = self.font.render(f"{rupees:03d}", True, WHITE)
        self.display_surface.blit(text, (x + 18, y))

    def draw_bombs_arrows(self, x, y):
        """Draw bomb and arrow counters."""
        # Bombs
        bombs = self.player_data['bombs']
        bomb_text = self.small_font.render(f"Bombs: {bombs:02d}", True, WHITE)
        self.display_surface.blit(bomb_text, (x, y))

        # Arrows
        arrows = self.player_data['arrows']
        arrow_text = self.small_font.render(f"Arrows: {arrows:02d}", True, WHITE)
        self.display_surface.blit(arrow_text, (x, y + 16))

    def draw_equipped_item(self, x, y):
        """Draw currently equipped item."""
        equipped = self.player_data['equipped_item']

        # Box
        pygame.draw.rect(self.display_surface, DARK_BLUE,
                         (x, y, 40, 40))
        pygame.draw.rect(self.display_surface, WHITE,
                         (x, y, 40, 40), 2)

        # Item icon
        if equipped in self.item_icons:
            icon = self.item_icons[equipped]
            icon_rect = icon.get_rect(center=(x + 20, y + 20))
            self.display_surface.blit(icon, icon_rect)

        # Label
        label = self.small_font.render("B", True, WHITE)
        self.display_surface.blit(label, (x + 15, y + 42))

    def draw_keys(self, x, y):
        """Draw key counter."""
        keys = self.player_data['keys']

        # Key icon
        pygame.draw.rect(self.display_surface, GOLD, (x, y + 2, 8, 4))
        pygame.draw.circle(self.display_surface, GOLD, (x + 12, y + 4), 4)

        # Count
        text = self.small_font.render(f"x{keys}", True, WHITE)
        self.display_surface.blit(text, (x + 20, y))

    def draw_minimap(self, x, y):
        """Draw a simple minimap."""
        map_size = 50
        pygame.draw.rect(self.display_surface, (30, 30, 60),
                         (x, y, map_size, map_size))
        pygame.draw.rect(self.display_surface, WHITE,
                         (x, y, map_size, map_size), 1)

        # Player position dot
        pygame.draw.circle(self.display_surface, GREEN,
                           (x + map_size // 2, y + map_size // 2), 3)

    def draw(self, surface):
        """Draw the complete HUD."""
        # HUD background
        pygame.draw.rect(surface, (20, 20, 40),
                         (0, 0, SCREEN_WIDTH, self.hud_height))
        pygame.draw.line(surface, WHITE,
                         (0, self.hud_height), (SCREEN_WIDTH, self.hud_height), 2)

        # Left section - Hearts
        self.draw_hearts(self.padding, self.padding)

        # Magic bar below hearts
        self.draw_magic_bar(self.padding, self.padding + 35)

        # Center section - Equipped item
        center_x = SCREEN_WIDTH // 2 - 20
        self.draw_equipped_item(center_x, self.padding)

        # Right section - Counters
        right_x = SCREEN_WIDTH - 150
        self.draw_rupees(right_x, self.padding)
        self.draw_bombs_arrows(right_x, self.padding + 25)

        # Keys
        self.draw_keys(right_x + 80, self.padding)

        # Mini-map (far right)
        self.draw_minimap(SCREEN_WIDTH - 60, self.padding)

        # Controls hint at bottom of HUD
        hint = self.small_font.render(
            "WASD:Move | J:Sword | K:Item | I:Inventory | ESC:Menu",
            True, (150, 150, 150)
        )
        hint_rect = hint.get_rect(center=(SCREEN_WIDTH // 2, self.hud_height - 10))
        surface.blit(hint, hint_rect)
