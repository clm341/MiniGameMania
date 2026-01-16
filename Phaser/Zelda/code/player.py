"""
Player class - handles Link's movement, combat, and interactions.
"""

import pygame
from settings import *


class Player(pygame.sprite.Sprite):
    def __init__(self, pos, groups, obstacle_sprites, player_data,
                 create_attack, create_projectile):
        super().__init__(groups)

        # References
        self.obstacle_sprites = obstacle_sprites
        self.player_data = player_data
        self.create_attack = create_attack
        self.create_projectile = create_projectile

        # Graphics
        self.image = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE))
        self.image.fill(GREEN)
        self.rect = self.image.get_rect(topleft=pos)
        self.hitbox = self.rect.inflate(-8, -8)

        # Movement
        self.direction = pygame.math.Vector2()
        self.facing = player_data.get('direction', DOWN)
        self.speed = PLAYER_SPEED

        # Animation
        self.animations = self.load_animations()
        self.animation_index = 0
        self.animation_speed = ANIMATION_SPEED
        self.last_animation_time = 0
        self.status = 'idle'

        # Stats
        self.health = player_data['health']
        self.max_health = player_data['max_health']
        self.magic = player_data['magic']
        self.max_magic = player_data['max_magic']

        # Combat
        self.attacking = False
        self.attack_cooldown = SWORD_COOLDOWN
        self.attack_time = 0
        self.spin_attack_charging = False
        self.spin_charge_start = 0

        # Invincibility frames
        self.invincible = False
        self.invincible_time = 0
        self.invincibility_duration = INVINCIBILITY_DURATION

        # Item usage
        self.can_use_item = True
        self.item_cooldown = 300
        self.item_use_time = 0

        # Running (Pegasus Boots)
        self.running = False
        self.run_speed = PLAYER_SPEED * 2

        # Input state
        self.keys_pressed = {
            'up': False,
            'down': False,
            'left': False,
            'right': False,
            'action': False,
        }

    @property
    def direction_facing(self):
        """Return the direction enum for current facing."""
        return self.facing

    def load_animations(self):
        """Load player animations (placeholder - creates colored rectangles)."""
        animations = {
            'idle_down': [],
            'idle_up': [],
            'idle_left': [],
            'idle_right': [],
            'walk_down': [],
            'walk_up': [],
            'walk_left': [],
            'walk_right': [],
            'attack_down': [],
            'attack_up': [],
            'attack_left': [],
            'attack_right': [],
        }

        # Create placeholder frames
        colors = {
            'down': GREEN,
            'up': (0, 200, 0),
            'left': (0, 150, 0),
            'right': (0, 100, 0),
        }

        for direction, color in colors.items():
            # Idle frames (1 frame)
            surf = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE))
            surf.fill(color)
            # Draw direction indicator
            pygame.draw.circle(surf, WHITE,
                               (TILE_SIZE * SCALE // 2, TILE_SIZE * SCALE // 4)
                               if direction in ['up', 'down'] else
                               (TILE_SIZE * SCALE // 4 if direction == 'left' else TILE_SIZE * SCALE * 3 // 4,
                                TILE_SIZE * SCALE // 2),
                               4)
            animations[f'idle_{direction}'] = [surf]

            # Walk frames (4 frames)
            for i in range(4):
                walk_surf = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE))
                walk_surf.fill(color)
                # Animate legs
                leg_offset = (i % 2) * 4
                pygame.draw.rect(walk_surf, (0, 50, 0),
                                 (8, TILE_SIZE * SCALE - 12 + leg_offset, 8, 8))
                pygame.draw.rect(walk_surf, (0, 50, 0),
                                 (TILE_SIZE * SCALE - 16, TILE_SIZE * SCALE - 12 - leg_offset, 8, 8))
                # Direction indicator
                pygame.draw.circle(walk_surf, WHITE,
                                   (TILE_SIZE * SCALE // 2, TILE_SIZE * SCALE // 4)
                                   if direction in ['up', 'down'] else
                                   (TILE_SIZE * SCALE // 4 if direction == 'left' else TILE_SIZE * SCALE * 3 // 4,
                                    TILE_SIZE * SCALE // 2),
                                   4)
                animations[f'walk_{direction}'].append(walk_surf)

            # Attack frames (3 frames)
            for i in range(3):
                attack_surf = pygame.Surface((TILE_SIZE * SCALE, TILE_SIZE * SCALE))
                attack_surf.fill(color)
                # Draw sword
                sword_color = (192, 192, 192)  # Silver
                if direction == 'down':
                    pygame.draw.rect(attack_surf, sword_color,
                                     (TILE_SIZE * SCALE // 2 - 2 + (i - 1) * 8,
                                      TILE_SIZE * SCALE - 8, 4, 12))
                elif direction == 'up':
                    pygame.draw.rect(attack_surf, sword_color,
                                     (TILE_SIZE * SCALE // 2 - 2 + (i - 1) * 8, -4, 4, 12))
                elif direction == 'left':
                    pygame.draw.rect(attack_surf, sword_color,
                                     (-4, TILE_SIZE * SCALE // 2 - 2 + (i - 1) * 8, 12, 4))
                elif direction == 'right':
                    pygame.draw.rect(attack_surf, sword_color,
                                     (TILE_SIZE * SCALE - 8,
                                      TILE_SIZE * SCALE // 2 - 2 + (i - 1) * 8, 12, 4))
                animations[f'attack_{direction}'].append(attack_surf)

        return animations

    def handle_key_down(self, key):
        """Handle key press events."""
        # Sword attack
        if key in [pygame.K_j, pygame.K_z]:
            self.attack()

        # Item use
        if key in [pygame.K_k, pygame.K_x]:
            self.use_item()

        # Action button (run with Pegasus Boots)
        if key in [pygame.K_l, pygame.K_c]:
            if self.player_data['items']['boots']:
                self.running = True

        # Quick item select
        item_keys = {
            pygame.K_1: 'bombs',
            pygame.K_2: 'bow',
            pygame.K_3: 'boomerang',
            pygame.K_4: 'hookshot',
            pygame.K_5: 'lamp',
            pygame.K_6: 'hammer',
            pygame.K_7: 'fire_rod',
            pygame.K_8: 'ice_rod',
        }
        if key in item_keys:
            self.player_data['equipped_item'] = item_keys[key]

    def input(self):
        """Handle continuous input (movement)."""
        keys = pygame.key.get_pressed()

        # Movement
        self.direction.x = 0
        self.direction.y = 0

        if not self.attacking:
            # Vertical
            if keys[pygame.K_UP] or keys[pygame.K_w]:
                self.direction.y = -1
                self.facing = UP
            elif keys[pygame.K_DOWN] or keys[pygame.K_s]:
                self.direction.y = 1
                self.facing = DOWN

            # Horizontal
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                self.direction.x = -1
                self.facing = LEFT
            elif keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                self.direction.x = 1
                self.facing = RIGHT

        # Stop running if action key released
        if not (keys[pygame.K_l] or keys[pygame.K_c]):
            self.running = False

        # Spin attack charge (hold sword button)
        if keys[pygame.K_j] or keys[pygame.K_z]:
            if not self.attacking and not self.spin_attack_charging:
                self.spin_attack_charging = True
                self.spin_charge_start = pygame.time.get_ticks()
        else:
            if self.spin_attack_charging:
                # Check if fully charged
                if pygame.time.get_ticks() - self.spin_charge_start >= SPIN_ATTACK_CHARGE_TIME:
                    self.spin_attack()
                self.spin_attack_charging = False

    def attack(self):
        """Perform sword attack."""
        current_time = pygame.time.get_ticks()
        if current_time - self.attack_time >= self.attack_cooldown:
            self.attacking = True
            self.attack_time = current_time
            self.create_attack(self)

    def spin_attack(self):
        """Perform spin attack (charged sword)."""
        self.attacking = True
        self.attack_time = pygame.time.get_ticks()
        # Spin attack hits in all directions with more damage
        self.create_attack(self)

    def use_item(self):
        """Use currently equipped item."""
        if not self.can_use_item:
            return

        current_time = pygame.time.get_ticks()
        equipped = self.player_data['equipped_item']
        items = self.player_data['items']

        # Check magic cost
        magic_cost = ITEM_MAGIC_COST.get(equipped, 0)
        if self.magic < magic_cost:
            return

        if equipped == 'bombs' and self.player_data['bombs'] > 0:
            self.player_data['bombs'] -= 1
            self.create_projectile(self.rect.center, self.facing, 'bomb')
            self.can_use_item = False
            self.item_use_time = current_time

        elif equipped == 'bow' and items['bow'] and self.player_data['arrows'] > 0:
            self.player_data['arrows'] -= 1
            self.create_projectile(self.rect.center, self.facing, 'arrow')
            self.can_use_item = False
            self.item_use_time = current_time

        elif equipped == 'boomerang' and items['boomerang'] != 'none':
            self.create_projectile(self.rect.center, self.facing, 'boomerang')
            self.can_use_item = False
            self.item_use_time = current_time

        elif equipped == 'hookshot' and items['hookshot']:
            self.create_projectile(self.rect.center, self.facing, 'hookshot')
            self.can_use_item = False
            self.item_use_time = current_time

        elif equipped == 'fire_rod' and items['fire_rod']:
            self.magic -= magic_cost
            self.create_projectile(self.rect.center, self.facing, 'fire')
            self.can_use_item = False
            self.item_use_time = current_time

        elif equipped == 'ice_rod' and items['ice_rod']:
            self.magic -= magic_cost
            self.create_projectile(self.rect.center, self.facing, 'ice')
            self.can_use_item = False
            self.item_use_time = current_time

    def take_damage(self, amount, source_pos):
        """Take damage from an enemy or hazard."""
        if self.invincible:
            return

        self.health -= amount
        self.player_data['health'] = self.health

        # Knockback
        knockback_dir = pygame.math.Vector2(self.rect.center) - pygame.math.Vector2(source_pos)
        if knockback_dir.length() > 0:
            knockback_dir.normalize_ip()
        self.rect.x += knockback_dir.x * 20
        self.rect.y += knockback_dir.y * 20
        self.hitbox.center = self.rect.center

        # Start invincibility
        self.invincible = True
        self.invincible_time = pygame.time.get_ticks()

    def heal(self, amount):
        """Heal the player."""
        self.health = min(self.health + amount, self.max_health)
        self.player_data['health'] = self.health

    def restore_magic(self, amount):
        """Restore magic."""
        self.magic = min(self.magic + amount, self.max_magic)
        self.player_data['magic'] = self.magic

    def move(self, dt):
        """Move the player."""
        if self.direction.magnitude() != 0:
            self.direction = self.direction.normalize()

        speed = self.run_speed if self.running else self.speed

        # Horizontal movement
        self.hitbox.x += self.direction.x * speed * dt
        self.collision('horizontal')

        # Vertical movement
        self.hitbox.y += self.direction.y * speed * dt
        self.collision('vertical')

        # Sync rect with hitbox
        self.rect.center = self.hitbox.center

    def collision(self, direction):
        """Handle collision with obstacles."""
        for sprite in self.obstacle_sprites:
            if sprite.rect.colliderect(self.hitbox):
                if direction == 'horizontal':
                    if self.direction.x > 0:  # Moving right
                        self.hitbox.right = sprite.rect.left
                    elif self.direction.x < 0:  # Moving left
                        self.hitbox.left = sprite.rect.right

                elif direction == 'vertical':
                    if self.direction.y > 0:  # Moving down
                        self.hitbox.bottom = sprite.rect.top
                    elif self.direction.y < 0:  # Moving up
                        self.hitbox.top = sprite.rect.bottom

    def cooldowns(self):
        """Handle attack and item cooldowns."""
        current_time = pygame.time.get_ticks()

        # Attack cooldown
        if self.attacking:
            if current_time - self.attack_time >= self.attack_cooldown:
                self.attacking = False

        # Item cooldown
        if not self.can_use_item:
            if current_time - self.item_use_time >= self.item_cooldown:
                self.can_use_item = True

        # Invincibility
        if self.invincible:
            if current_time - self.invincible_time >= self.invincibility_duration:
                self.invincible = False

    def get_status(self):
        """Determine animation status."""
        direction_names = {UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right'}
        dir_name = direction_names[self.facing]

        if self.attacking:
            self.status = f'attack_{dir_name}'
        elif self.direction.magnitude() != 0:
            self.status = f'walk_{dir_name}'
        else:
            self.status = f'idle_{dir_name}'

    def animate(self):
        """Animate the player sprite."""
        animation = self.animations.get(self.status, self.animations['idle_down'])

        current_time = pygame.time.get_ticks()
        if current_time - self.last_animation_time >= self.animation_speed:
            self.last_animation_time = current_time
            self.animation_index = (self.animation_index + 1) % len(animation)

        if animation:
            self.image = animation[int(self.animation_index) % len(animation)]

        # Flicker when invincible
        if self.invincible:
            if (current_time // 100) % 2:
                self.image.set_alpha(100)
            else:
                self.image.set_alpha(255)
        else:
            self.image.set_alpha(255)

    def update(self, dt):
        """Update player state."""
        self.input()
        self.cooldowns()
        self.get_status()
        self.move(dt)
        self.animate()
