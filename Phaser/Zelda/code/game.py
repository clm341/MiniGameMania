"""
Game state manager - handles different game states (title, playing, paused, etc.)
"""

import pygame
import json
import os
from settings import *


class Game:
    def __init__(self, screen):
        self.screen = screen
        self.state = 'title'  # title, playing, paused, inventory, game_over, save_menu

        # Game data
        self.player_data = self.get_default_player_data()

        # Initialize subsystems (will be loaded lazily)
        self.level = None
        self.title_screen = None
        self.inventory_screen = None
        self.hud = None

        # Font for temporary rendering
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)

        # Title screen selection
        self.title_selection = 0
        self.title_options = ['New Game', 'Load Game', 'Quit']

        # Initialize title screen
        self.init_title_screen()

    def get_default_player_data(self):
        """Return default player data for new game."""
        return {
            'health': PLAYER_HEALTH * 2,  # HP (hearts * 2)
            'max_health': PLAYER_HEALTH * 2,
            'magic': PLAYER_MAGIC,
            'max_magic': PLAYER_MAGIC,
            'rupees': 0,
            'bombs': 0,
            'arrows': 0,
            'keys': 0,
            'position': {'x': SCREEN_WIDTH // 2, 'y': SCREEN_HEIGHT // 2},
            'direction': DOWN,
            'current_world': 'light',  # light or dark
            'current_map': 'overworld',
            'current_room': (8, 8),  # Starting room coordinates

            # Items obtained
            'items': {
                'sword': 'fighter',  # none, fighter, master, tempered, golden
                'shield': 'small',   # none, small, fire, mirror
                'armor': 'green',    # green, blue, red

                # Selectable items
                'bow': False,
                'boomerang': 'normal',  # none, normal, magic
                'hookshot': False,
                'bombs': True,
                'mushroom': False,
                'powder': False,
                'fire_rod': False,
                'ice_rod': False,
                'bombos': False,
                'ether': False,
                'quake': False,
                'lamp': True,
                'hammer': False,
                'flute': False,
                'net': False,
                'book': False,
                'bottles': [],  # List of bottle contents
                'cane_somaria': False,
                'cane_byrna': False,
                'cape': False,
                'mirror': False,
                'glove': 'none',  # none, power, titan
                'boots': False,
                'flippers': False,
                'pearl': False,
            },

            # Currently equipped item (Y button)
            'equipped_item': 'bombs',

            # Dungeon progress
            'dungeons_completed': [],
            'boss_keys': [],
            'maps': [],
            'compasses': [],

            # Heart pieces collected (4 = 1 heart container)
            'heart_pieces': 0,

            # Play time
            'play_time': 0,
        }

    def init_title_screen(self):
        """Initialize title screen assets."""
        pass  # Will create visual title screen

    def init_game(self):
        """Initialize the main game (level, player, etc.)."""
        from level import Level
        from hud import HUD

        self.level = Level(self.player_data)
        self.hud = HUD(self.player_data)

    def handle_event(self, event):
        """Handle pygame events based on current state."""
        if event.type == pygame.KEYDOWN:
            if self.state == 'title':
                self.handle_title_input(event.key)
            elif self.state == 'playing':
                self.handle_playing_input(event.key)
            elif self.state == 'inventory':
                self.handle_inventory_input(event.key)
            elif self.state == 'paused':
                self.handle_pause_input(event.key)
            elif self.state == 'game_over':
                self.handle_game_over_input(event.key)
            elif self.state == 'save_menu':
                self.handle_save_menu_input(event.key)

    def handle_title_input(self, key):
        """Handle input on title screen."""
        if key in [pygame.K_UP, pygame.K_w]:
            self.title_selection = (self.title_selection - 1) % len(self.title_options)
        elif key in [pygame.K_DOWN, pygame.K_s]:
            self.title_selection = (self.title_selection + 1) % len(self.title_options)
        elif key in [pygame.K_RETURN, pygame.K_z, pygame.K_j]:
            self.select_title_option()

    def select_title_option(self):
        """Execute selected title screen option."""
        option = self.title_options[self.title_selection]
        if option == 'New Game':
            self.player_data = self.get_default_player_data()
            self.init_game()
            self.state = 'playing'
        elif option == 'Load Game':
            if self.load_game():
                self.init_game()
                self.state = 'playing'
        elif option == 'Quit':
            pygame.quit()
            import sys
            sys.exit()

    def handle_playing_input(self, key):
        """Handle input during gameplay."""
        if key == pygame.K_ESCAPE:
            self.state = 'save_menu'
        elif key in [pygame.K_i, pygame.K_RETURN]:
            self.state = 'inventory'
        elif key == pygame.K_p:
            self.state = 'paused'

        # Pass input to level for player controls
        if self.level:
            self.level.handle_key_down(key)

    def handle_inventory_input(self, key):
        """Handle input in inventory screen."""
        if key in [pygame.K_i, pygame.K_RETURN, pygame.K_ESCAPE]:
            self.state = 'playing'
        # TODO: Implement inventory navigation

    def handle_pause_input(self, key):
        """Handle input when paused."""
        if key in [pygame.K_p, pygame.K_ESCAPE]:
            self.state = 'playing'

    def handle_game_over_input(self, key):
        """Handle input on game over screen."""
        if key in [pygame.K_RETURN, pygame.K_z]:
            self.state = 'title'

    def handle_save_menu_input(self, key):
        """Handle input in save menu."""
        if key == pygame.K_ESCAPE:
            self.state = 'playing'
        elif key == pygame.K_s:
            self.save_game()
            self.state = 'playing'
        elif key == pygame.K_q:
            self.state = 'title'

    def update(self, dt):
        """Update game state."""
        if self.state == 'playing':
            if self.level:
                self.level.update(dt)
                self.player_data['play_time'] += dt

                # Check for game over
                if self.player_data['health'] <= 0:
                    self.state = 'game_over'

    def draw(self):
        """Draw current game state."""
        self.screen.fill(BLACK)

        if self.state == 'title':
            self.draw_title_screen()
        elif self.state == 'playing':
            if self.level:
                self.level.draw(self.screen)
            if self.hud:
                self.hud.draw(self.screen)
        elif self.state == 'inventory':
            self.draw_inventory_screen()
        elif self.state == 'paused':
            self.draw_pause_screen()
        elif self.state == 'game_over':
            self.draw_game_over_screen()
        elif self.state == 'save_menu':
            self.draw_save_menu()

    def draw_title_screen(self):
        """Draw the title screen."""
        # Background
        self.screen.fill(DARK_BLUE)

        # Title
        title_text = self.font.render("ZELDA: A LINK TO THE PAST", True, GOLD)
        subtitle_text = self.small_font.render("Clone Edition", True, WHITE)

        title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3))
        subtitle_rect = subtitle_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3 + 40))

        self.screen.blit(title_text, title_rect)
        self.screen.blit(subtitle_text, subtitle_rect)

        # Menu options
        for i, option in enumerate(self.title_options):
            color = GOLD if i == self.title_selection else WHITE
            text = self.font.render(option, True, color)
            rect = text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + i * 50))
            self.screen.blit(text, rect)

            # Draw selector arrow
            if i == self.title_selection:
                arrow = self.font.render(">", True, GOLD)
                arrow_rect = arrow.get_rect(right=rect.left - 20, centery=rect.centery)
                self.screen.blit(arrow, arrow_rect)

        # Controls hint
        hint_text = self.small_font.render("Arrow Keys: Navigate | Enter: Select", True, LIGHT_BLUE)
        hint_rect = hint_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50))
        self.screen.blit(hint_text, hint_rect)

    def draw_inventory_screen(self):
        """Draw the inventory/item selection screen."""
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.fill(DARK_BLUE)
        overlay.set_alpha(200)
        self.screen.blit(overlay, (0, 0))

        # Title
        title = self.font.render("INVENTORY", True, WHITE)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, 50))
        self.screen.blit(title, title_rect)

        # Display items in a grid
        items = self.player_data['items']
        y_offset = 100
        x_start = 100

        equipped_items = ['bow', 'boomerang', 'hookshot', 'bombs', 'fire_rod', 'ice_rod',
                          'lamp', 'hammer', 'net', 'cane_somaria', 'cane_byrna', 'cape']

        for i, item in enumerate(equipped_items):
            col = i % 4
            row = i // 4
            x = x_start + col * 150
            y = y_offset + row * 60

            has_item = items.get(item, False)
            if isinstance(has_item, str):
                has_item = has_item != 'none'

            color = WHITE if has_item else (100, 100, 100)
            item_name = item.replace('_', ' ').title()
            text = self.small_font.render(item_name, True, color)
            self.screen.blit(text, (x, y))

            # Highlight equipped item
            if item == self.player_data['equipped_item']:
                pygame.draw.rect(self.screen, GOLD, (x - 5, y - 5, 140, 30), 2)

        # Controls
        hint = self.small_font.render("Press I or ESC to close", True, LIGHT_BLUE)
        hint_rect = hint.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50))
        self.screen.blit(hint, hint_rect)

    def draw_pause_screen(self):
        """Draw pause screen overlay."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.fill(BLACK)
        overlay.set_alpha(150)
        self.screen.blit(overlay, (0, 0))

        text = self.font.render("PAUSED", True, WHITE)
        rect = text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(text, rect)

        hint = self.small_font.render("Press P to resume", True, LIGHT_BLUE)
        hint_rect = hint.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(hint, hint_rect)

    def draw_game_over_screen(self):
        """Draw game over screen."""
        self.screen.fill(BLACK)

        # Game Over text
        text = self.font.render("GAME OVER", True, RED)
        rect = text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(text, rect)

        hint = self.small_font.render("Press Enter to return to title", True, WHITE)
        hint_rect = hint.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(hint, hint_rect)

    def draw_save_menu(self):
        """Draw save menu overlay."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.fill(DARK_BLUE)
        overlay.set_alpha(220)
        self.screen.blit(overlay, (0, 0))

        title = self.font.render("SAVE MENU", True, WHITE)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3))
        self.screen.blit(title, title_rect)

        options = [
            ("S - Save Game", WHITE),
            ("Q - Quit to Title", WHITE),
            ("ESC - Return to Game", LIGHT_BLUE),
        ]

        for i, (text, color) in enumerate(options):
            rendered = self.small_font.render(text, True, color)
            rect = rendered.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + i * 40))
            self.screen.blit(rendered, rect)

    def save_game(self):
        """Save current game state to file."""
        save_path = os.path.join(os.path.dirname(__file__), '..', SAVE_FILE)

        # Update position from player if level exists
        if self.level and self.level.player:
            self.player_data['position']['x'] = self.level.player.rect.x
            self.player_data['position']['y'] = self.level.player.rect.y
            self.player_data['direction'] = self.level.player.direction

        try:
            with open(save_path, 'w') as f:
                json.dump(self.player_data, f, indent=2)
            print("Game saved successfully!")
            return True
        except Exception as e:
            print(f"Error saving game: {e}")
            return False

    def load_game(self):
        """Load game state from file."""
        save_path = os.path.join(os.path.dirname(__file__), '..', SAVE_FILE)

        try:
            with open(save_path, 'r') as f:
                loaded_data = json.load(f)
            self.player_data = loaded_data
            print("Game loaded successfully!")
            return True
        except FileNotFoundError:
            print("No save file found.")
            return False
        except Exception as e:
            print(f"Error loading game: {e}")
            return False
