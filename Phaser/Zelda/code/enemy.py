"""
Enemy system - handles enemy AI, behaviors, and combat.
"""

import pygame
import random
import math
from settings import *


class Enemy(pygame.sprite.Sprite):
    """Base enemy class with common functionality."""

    def __init__(self, pos, groups, obstacle_sprites, player, enemy_type='soldier_green'):
        super().__init__(groups)
        self.obstacle_sprites = obstacle_sprites
        self.player = player
        self.enemy_type = enemy_type

        # Get stats from settings
        stats = ENEMY_TYPES.get(enemy_type, ENEMY_TYPES['soldier_green'])
        self.health = stats['health']
        self.max_health = stats['health']
        self.damage = stats['damage']
        self.speed = stats['speed'] * SCALE
        self.behavior = stats['behavior']

        # Graphics
        self.image = self.create_enemy_sprite()
        self.rect = self.image.get_rect(topleft=pos)
        self.hitbox = self.rect.inflate(-4, -4)

        # Movement
        self.direction = pygame.math.Vector2()
        self.facing = DOWN

        # State
        self.state = 'idle'  # idle, patrol, chase, attack, stunned, dead
        self.alert = False
        self.can_see_player = False

        # Timers
        self.last_action_time = pygame.time.get_ticks()
        self.action_cooldown = random.randint(1000, 3000)
        self.stun_time = 0
        self.stun_duration = 500

        # Attack properties
        self.attack_cooldown = 1000
        self.last_attack_time = 0
        self.attack_range = TILE_SIZE * SCALE * 1.5

        # Patrol properties
        self.patrol_points = []
        self.current_patrol_index = 0
        self.patrol_wait_time = 0

        # Shooting enemies
        self.can_shoot = enemy_type in ['octorok', 'moblin']
        self.shoot_cooldown = 2000
        self.last_shoot_time = 0

        # Knockback
        self.knockback = pygame.math.Vector2()
        self.knockback_resistance = 0.9

        # Death
        self.dying = False
        self.death_time = 0

    def create_enemy_sprite(self):
        """Create enemy sprite based on type."""
        size = TILE_SIZE * SCALE
        surface = pygame.Surface((size, size))

        colors = {
            'soldier_green': (0, 128, 0),
            'soldier_blue': (0, 0, 180),
            'octorok': (255, 100, 100),
            'moblin': (180, 100, 50),
            'keese': (50, 50, 50),
            'stalfos': (200, 200, 180),
            'rope': (150, 100, 50),
            'tektite': (100, 100, 200),
            'armos': (128, 128, 128),
            'buzzblob': (200, 200, 50),
        }

        color = colors.get(self.enemy_type, RED)
        surface.fill(color)

        # Add simple details
        pygame.draw.circle(surface, WHITE, (size // 3, size // 3), 4)
        pygame.draw.circle(surface, WHITE, (size * 2 // 3, size // 3), 4)
        pygame.draw.circle(surface, BLACK, (size // 3, size // 3), 2)
        pygame.draw.circle(surface, BLACK, (size * 2 // 3, size // 3), 2)

        return surface

    def get_player_distance_direction(self):
        """Get distance and direction to player."""
        enemy_vec = pygame.math.Vector2(self.rect.center)
        player_vec = pygame.math.Vector2(self.player.rect.center)

        distance = (player_vec - enemy_vec).magnitude()

        if distance > 0:
            direction = (player_vec - enemy_vec).normalize()
        else:
            direction = pygame.math.Vector2()

        return distance, direction

    def check_line_of_sight(self):
        """Check if enemy can see the player (no obstacles between)."""
        distance, direction = self.get_player_distance_direction()

        # Simple distance check for now
        if distance < TILE_SIZE * SCALE * 8:
            self.can_see_player = True
            return True

        self.can_see_player = False
        return False

    def behavior_patrol(self, dt):
        """Patrol behavior - move between points or wander."""
        if not self.alert:
            # Wander randomly
            current_time = pygame.time.get_ticks()
            if current_time - self.last_action_time >= self.action_cooldown:
                self.last_action_time = current_time
                self.action_cooldown = random.randint(1000, 3000)

                # Pick random direction
                self.direction.x = random.choice([-1, 0, 1])
                self.direction.y = random.choice([-1, 0, 1])

                if self.direction.x != 0:
                    self.facing = RIGHT if self.direction.x > 0 else LEFT
                elif self.direction.y != 0:
                    self.facing = DOWN if self.direction.y > 0 else UP

        # Check if player is visible
        if self.check_line_of_sight():
            self.alert = True
            self.state = 'chase'

    def behavior_chase(self, dt):
        """Chase behavior - follow the player."""
        distance, direction = self.get_player_distance_direction()

        if distance < self.attack_range:
            self.state = 'attack'
            self.direction = pygame.math.Vector2()
        elif distance > TILE_SIZE * SCALE * 12:
            self.alert = False
            self.state = 'patrol'
        else:
            self.direction = direction

            # Update facing
            if abs(direction.x) > abs(direction.y):
                self.facing = RIGHT if direction.x > 0 else LEFT
            else:
                self.facing = DOWN if direction.y > 0 else UP

    def behavior_attack(self, dt):
        """Attack behavior - attack the player."""
        distance, direction = self.get_player_distance_direction()

        if distance > self.attack_range * 1.5:
            self.state = 'chase'
            return

        current_time = pygame.time.get_ticks()
        if current_time - self.last_attack_time >= self.attack_cooldown:
            self.last_attack_time = current_time
            # Attack is handled by collision in level

    def behavior_shoot(self, dt):
        """Shooting behavior for ranged enemies."""
        if not self.can_shoot:
            return

        distance, direction = self.get_player_distance_direction()

        current_time = pygame.time.get_ticks()
        if distance < TILE_SIZE * SCALE * 6 and \
                current_time - self.last_shoot_time >= self.shoot_cooldown:
            self.last_shoot_time = current_time
            # TODO: Create projectile
            self.direction = pygame.math.Vector2()

    def behavior_fly(self, dt):
        """Flying behavior (Keese) - erratic movement towards player."""
        distance, direction = self.get_player_distance_direction()

        if distance < TILE_SIZE * SCALE * 8:
            # Fly towards player with some randomness
            self.direction = direction + pygame.math.Vector2(
                random.uniform(-0.3, 0.3),
                random.uniform(-0.3, 0.3)
            )
            if self.direction.magnitude() > 0:
                self.direction.normalize_ip()

    def behavior_charge(self, dt):
        """Charge behavior (Rope) - charge when player is in line."""
        distance, direction = self.get_player_distance_direction()

        # Check if player is roughly in line (horizontal or vertical)
        player_vec = pygame.math.Vector2(self.player.rect.center)
        enemy_vec = pygame.math.Vector2(self.rect.center)

        diff = player_vec - enemy_vec

        if distance < TILE_SIZE * SCALE * 6:
            # Check if roughly aligned
            if abs(diff.x) < TILE_SIZE * SCALE and abs(diff.y) > TILE_SIZE * SCALE:
                # Vertical alignment - charge vertically
                self.direction.y = 1 if diff.y > 0 else -1
                self.direction.x = 0
                self.speed = PLAYER_SPEED * 1.5
            elif abs(diff.y) < TILE_SIZE * SCALE and abs(diff.x) > TILE_SIZE * SCALE:
                # Horizontal alignment - charge horizontally
                self.direction.x = 1 if diff.x > 0 else -1
                self.direction.y = 0
                self.speed = PLAYER_SPEED * 1.5
            else:
                # Not aligned - reset speed and patrol
                self.speed = ENEMY_TYPES[self.enemy_type]['speed'] * SCALE
                self.behavior_patrol(dt)
        else:
            self.speed = ENEMY_TYPES[self.enemy_type]['speed'] * SCALE
            self.behavior_patrol(dt)

    def behavior_jump(self, dt):
        """Jumping behavior (Tektite) - periodic jumps."""
        current_time = pygame.time.get_ticks()

        if current_time - self.last_action_time >= self.action_cooldown:
            self.last_action_time = current_time
            self.action_cooldown = random.randint(800, 1500)

            distance, direction = self.get_player_distance_direction()

            if distance < TILE_SIZE * SCALE * 6:
                # Jump towards player
                self.direction = direction * 3
            else:
                # Random jump
                self.direction = pygame.math.Vector2(
                    random.uniform(-2, 2),
                    random.uniform(-2, 2)
                )
        else:
            # Slow down between jumps
            self.direction *= 0.95

    def behavior_wander(self, dt):
        """Simple wandering behavior."""
        self.behavior_patrol(dt)

    def behavior_awaken(self, dt):
        """Armos behavior - stationary until approached."""
        distance, direction = self.get_player_distance_direction()

        if not self.alert:
            self.direction = pygame.math.Vector2()
            if distance < TILE_SIZE * SCALE * 2:
                self.alert = True
        else:
            # Chase after awakening
            self.behavior_chase(dt)

    def behavior_electric(self, dt):
        """Buzzblob behavior - moves slowly, damages on contact."""
        self.behavior_patrol(dt)
        self.speed = SCALE * 0.5

    def take_damage(self, amount, source_pos):
        """Take damage from player attack."""
        self.health -= amount

        # Knockback
        knockback_dir = pygame.math.Vector2(self.rect.center) - pygame.math.Vector2(source_pos)
        if knockback_dir.magnitude() > 0:
            knockback_dir.normalize_ip()
        self.knockback = knockback_dir * 10

        # Stun
        self.stun_time = pygame.time.get_ticks()
        self.state = 'stunned'

        # Check death
        if self.health <= 0:
            self.die()

    def die(self):
        """Handle enemy death."""
        self.dying = True
        self.death_time = pygame.time.get_ticks()
        # TODO: Drop items, play death animation
        self.kill()

    def move(self, dt):
        """Move the enemy."""
        # Apply knockback
        if self.knockback.magnitude() > 0.5:
            self.hitbox.x += self.knockback.x
            self.hitbox.y += self.knockback.y
            self.knockback *= self.knockback_resistance
        else:
            self.knockback = pygame.math.Vector2()

        # Normal movement
        if self.direction.magnitude() != 0:
            direction = self.direction.normalize() if self.direction.magnitude() > 1 else self.direction

            # Horizontal
            self.hitbox.x += direction.x * self.speed * dt
            self.collision('horizontal')

            # Vertical
            self.hitbox.y += direction.y * self.speed * dt
            self.collision('vertical')

        self.rect.center = self.hitbox.center

    def collision(self, direction):
        """Handle collision with obstacles."""
        for sprite in self.obstacle_sprites:
            if sprite.rect.colliderect(self.hitbox):
                if direction == 'horizontal':
                    if self.direction.x > 0:
                        self.hitbox.right = sprite.rect.left
                    elif self.direction.x < 0:
                        self.hitbox.left = sprite.rect.right
                    self.direction.x *= -1  # Reverse direction

                elif direction == 'vertical':
                    if self.direction.y > 0:
                        self.hitbox.bottom = sprite.rect.top
                    elif self.direction.y < 0:
                        self.hitbox.top = sprite.rect.bottom
                    self.direction.y *= -1

    def update_behavior(self, dt):
        """Update enemy behavior based on type."""
        if self.state == 'stunned':
            if pygame.time.get_ticks() - self.stun_time >= self.stun_duration:
                self.state = 'chase' if self.alert else 'patrol'
            return

        behavior_map = {
            'patrol': self.behavior_patrol,
            'chase': self.behavior_chase,
            'shoot': self.behavior_shoot,
            'fly': self.behavior_fly,
            'charge': self.behavior_charge,
            'jump': self.behavior_jump,
            'wander': self.behavior_wander,
            'awaken': self.behavior_awaken,
            'electric': self.behavior_electric,
        }

        behavior_func = behavior_map.get(self.behavior, self.behavior_patrol)
        behavior_func(dt)

        # Also check for shooting
        if self.can_shoot:
            self.behavior_shoot(dt)

    def update(self, dt):
        """Update enemy state."""
        if self.dying:
            return

        self.update_behavior(dt)
        self.move(dt)


class EnemyManager:
    """Manages enemy spawning and tracking."""

    def __init__(self, visible_sprites, enemy_sprites, obstacle_sprites, player):
        self.visible_sprites = visible_sprites
        self.enemy_sprites = enemy_sprites
        self.obstacle_sprites = obstacle_sprites
        self.player = player

    def spawn_enemy(self, x, y, enemy_type):
        """Spawn an enemy at the given position."""
        enemy = Enemy(
            pos=(x, y),
            groups=[self.visible_sprites, self.enemy_sprites],
            obstacle_sprites=self.obstacle_sprites,
            player=self.player,
            enemy_type=enemy_type
        )
        return enemy

    def spawn_enemies_from_map(self, enemy_data):
        """Spawn enemies based on map data."""
        for data in enemy_data:
            self.spawn_enemy(data['x'], data['y'], data['type'])

    def clear_enemies(self):
        """Remove all enemies."""
        for enemy in self.enemy_sprites:
            enemy.kill()
