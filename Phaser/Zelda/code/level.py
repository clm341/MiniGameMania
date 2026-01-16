"""
Level management - handles the game world, tiles, and all entities.
"""

import pygame
from settings import *
from player import Player
from camera import Camera
from tilemap import TileMap
from enemy import Enemy, EnemyManager


class Level:
    def __init__(self, player_data):
        self.player_data = player_data
        self.display_surface = pygame.display.get_surface()

        # Sprite groups
        self.visible_sprites = YSortCameraGroup()
        self.obstacle_sprites = pygame.sprite.Group()
        self.enemy_sprites = pygame.sprite.Group()
        self.item_sprites = pygame.sprite.Group()
        self.projectile_sprites = pygame.sprite.Group()

        # Camera
        self.camera = Camera(SCREEN_WIDTH, SCREEN_HEIGHT)

        # Create tilemap
        self.tilemap = TileMap(self.obstacle_sprites)

        # Create player
        start_pos = (player_data['position']['x'], player_data['position']['y'])
        self.player = Player(
            pos=start_pos,
            groups=[self.visible_sprites],
            obstacle_sprites=self.obstacle_sprites,
            player_data=player_data,
            create_attack=self.create_attack,
            create_projectile=self.create_projectile,
        )

        # Enemy manager
        self.enemy_manager = EnemyManager(
            self.visible_sprites,
            self.enemy_sprites,
            self.obstacle_sprites,
            self.player
        )

        # Spawn some test enemies
        self.spawn_test_enemies()

        # Attack sprites
        self.current_attack = None

    def spawn_test_enemies(self):
        """Spawn test enemies for demonstration."""
        enemy_positions = [
            (400, 300, 'soldier_green'),
            (600, 400, 'octorok'),
            (200, 500, 'keese'),
            (500, 200, 'stalfos'),
        ]

        for x, y, enemy_type in enemy_positions:
            self.enemy_manager.spawn_enemy(x, y, enemy_type)

    def create_attack(self, player):
        """Create sword attack sprite."""
        self.current_attack = SwordAttack(
            player,
            [self.visible_sprites],
            self.enemy_sprites
        )

    def create_projectile(self, pos, direction, projectile_type):
        """Create a projectile (arrow, bomb, boomerang, etc.)."""
        Projectile(
            pos,
            direction,
            projectile_type,
            [self.visible_sprites, self.projectile_sprites],
            self.obstacle_sprites,
            self.enemy_sprites
        )

    def handle_key_down(self, key):
        """Handle key press events."""
        self.player.handle_key_down(key)

    def update(self, dt):
        """Update all level entities."""
        # Update all visible sprites
        self.visible_sprites.update(dt)

        # Update camera to follow player
        self.camera.update(self.player)

        # Check for attack collisions
        self.check_attack_collisions()

        # Check enemy-player collisions
        self.check_enemy_collisions()

        # Clean up finished attack
        if self.current_attack and not self.current_attack.alive():
            self.current_attack = None

        # Sync player data
        self.player_data['position']['x'] = self.player.rect.x
        self.player_data['position']['y'] = self.player.rect.y
        self.player_data['health'] = self.player.health
        self.player_data['magic'] = self.player.magic

    def check_attack_collisions(self):
        """Check if player's attack hits enemies."""
        if self.current_attack:
            for enemy in self.enemy_sprites:
                if self.current_attack.rect.colliderect(enemy.hitbox):
                    enemy.take_damage(self.current_attack.damage, self.player.rect.center)

    def check_enemy_collisions(self):
        """Check if enemies hit the player."""
        if not self.player.invincible:
            for enemy in self.enemy_sprites:
                if self.player.hitbox.colliderect(enemy.hitbox):
                    self.player.take_damage(enemy.damage, enemy.rect.center)

    def draw(self, surface):
        """Draw the level."""
        # Fill background
        surface.fill(DARK_GREEN)

        # Draw tilemap
        self.tilemap.draw(surface, self.camera)

        # Draw all visible sprites with Y-sorting
        self.visible_sprites.custom_draw(self.player, self.camera)


class YSortCameraGroup(pygame.sprite.Group):
    """Sprite group that draws sprites sorted by Y position (depth)."""

    def __init__(self):
        super().__init__()
        self.display_surface = pygame.display.get_surface()
        self.half_width = SCREEN_WIDTH // 2
        self.half_height = SCREEN_HEIGHT // 2
        self.offset = pygame.math.Vector2()

    def custom_draw(self, player, camera):
        """Draw sprites sorted by Y position relative to camera."""
        # Calculate offset from player
        self.offset.x = player.rect.centerx - self.half_width
        self.offset.y = player.rect.centery - self.half_height

        # Sort sprites by Y position (bottom of sprite)
        for sprite in sorted(self.sprites(), key=lambda s: s.rect.centery):
            offset_pos = sprite.rect.topleft - self.offset
            self.display_surface.blit(sprite.image, offset_pos)


class SwordAttack(pygame.sprite.Sprite):
    """Sword attack hitbox."""

    def __init__(self, player, groups, enemy_sprites):
        super().__init__(groups)
        self.player = player
        self.enemy_sprites = enemy_sprites
        self.damage = SWORD_DAMAGE

        # Determine sword position based on player direction
        self.direction = player.direction

        # Create attack surface
        if self.direction in [UP, DOWN]:
            self.image = pygame.Surface((TILE_SIZE * SCALE * 2, TILE_SIZE * SCALE))
        else:
            self.image = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE * 2))

        self.image.fill(LIGHT_BLUE)
        self.image.set_alpha(100)

        # Position relative to player
        self.rect = self.image.get_rect()
        self.position_attack()

        # Duration
        self.spawn_time = pygame.time.get_ticks()
        self.duration = 200  # milliseconds

    def position_attack(self):
        """Position the attack hitbox relative to player."""
        if self.direction == UP:
            self.rect.midbottom = self.player.rect.midtop
        elif self.direction == DOWN:
            self.rect.midtop = self.player.rect.midbottom
        elif self.direction == LEFT:
            self.rect.midright = self.player.rect.midleft
        elif self.direction == RIGHT:
            self.rect.midleft = self.player.rect.midright

    def update(self, dt):
        """Update attack position and check duration."""
        self.position_attack()

        if pygame.time.get_ticks() - self.spawn_time >= self.duration:
            self.kill()


class Projectile(pygame.sprite.Sprite):
    """Projectile base class (arrows, bombs, boomerang, etc.)."""

    def __init__(self, pos, direction, projectile_type, groups, obstacles, enemies):
        super().__init__(groups)
        self.projectile_type = projectile_type
        self.direction = direction
        self.obstacles = obstacles
        self.enemies = enemies

        # Set properties based on type
        self.setup_projectile()

        # Position
        self.rect = self.image.get_rect(center=pos)
        self.pos = pygame.math.Vector2(pos)

        # Movement
        self.velocity = pygame.math.Vector2(DIRECTION_VECTORS[direction]) * self.speed

        # Lifetime
        self.spawn_time = pygame.time.get_ticks()

    def setup_projectile(self):
        """Set up projectile properties based on type."""
        if self.projectile_type == 'arrow':
            self.image = pygame.Surface((8 * SCALE, 4 * SCALE))
            self.image.fill(YELLOW)
            self.speed = 8
            self.damage = ITEM_DAMAGE['arrow']
            self.lifetime = 2000
        elif self.projectile_type == 'bomb':
            self.image = pygame.Surface((12 * SCALE, 12 * SCALE))
            self.image.fill(BLACK)
            self.speed = 0
            self.damage = ITEM_DAMAGE['bomb']
            self.lifetime = 3000  # Fuse time
        elif self.projectile_type == 'boomerang':
            self.image = pygame.Surface((8 * SCALE, 8 * SCALE))
            self.image.fill(BLUE)
            self.speed = 6
            self.damage = ITEM_DAMAGE['boomerang']
            self.lifetime = 1500
            self.returning = False
        elif self.projectile_type == 'hookshot':
            self.image = pygame.Surface((8 * SCALE, 8 * SCALE))
            self.image.fill((139, 69, 19))  # Brown
            self.speed = 10
            self.damage = ITEM_DAMAGE['hookshot']
            self.lifetime = 500
        else:
            # Default projectile
            self.image = pygame.Surface((8 * SCALE, 8 * SCALE))
            self.image.fill(WHITE)
            self.speed = 5
            self.damage = 2
            self.lifetime = 1000

    def update(self, dt):
        """Update projectile position and check collisions."""
        # Move projectile
        self.pos += self.velocity * dt
        self.rect.center = self.pos

        # Check obstacle collision
        for obstacle in self.obstacles:
            if self.rect.colliderect(obstacle.rect):
                self.on_collision()
                return

        # Check enemy collision
        for enemy in self.enemies:
            if self.rect.colliderect(enemy.hitbox):
                enemy.take_damage(self.damage, self.rect.center)
                if self.projectile_type != 'boomerang':
                    self.kill()
                return

        # Check lifetime
        if pygame.time.get_ticks() - self.spawn_time >= self.lifetime:
            self.on_expire()

    def on_collision(self):
        """Handle collision with obstacle."""
        if self.projectile_type == 'bomb':
            self.explode()
        else:
            self.kill()

    def on_expire(self):
        """Handle projectile expiration."""
        if self.projectile_type == 'bomb':
            self.explode()
        else:
            self.kill()

    def explode(self):
        """Create bomb explosion."""
        # TODO: Create explosion effect and damage area
        self.kill()
