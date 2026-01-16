# Game Settings for Zelda: A Link to the Past Clone

# Display settings (SNES was 256x224, we scale up for modern displays)
TILE_SIZE = 16
SCALE = 3
SCREEN_WIDTH = 256 * SCALE  # 768
SCREEN_HEIGHT = 224 * SCALE  # 672
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
DARK_GREEN = (34, 139, 34)
LIGHT_BLUE = (135, 206, 235)
DARK_BLUE = (0, 0, 139)
GOLD = (255, 215, 0)
HEART_RED = (248, 56, 0)
MAGIC_GREEN = (0, 168, 0)

# Player settings
PLAYER_SPEED = 3 * SCALE
PLAYER_HEALTH = 6  # Hearts (each heart = 2 HP, so 12 HP total like starting game)
PLAYER_MAX_HEALTH = 20  # Max hearts possible
PLAYER_MAGIC = 32  # Magic meter units
PLAYER_MAX_MAGIC = 128

# Combat settings
SWORD_DAMAGE = 2
SWORD_COOLDOWN = 300  # milliseconds
SPIN_ATTACK_CHARGE_TIME = 1000  # milliseconds to charge spin attack
SPIN_ATTACK_DAMAGE = 4
INVINCIBILITY_DURATION = 1000  # milliseconds after being hit

# Item damage values
ITEM_DAMAGE = {
    'sword': 2,
    'master_sword': 4,
    'tempered_sword': 6,
    'golden_sword': 12,
    'arrow': 4,
    'silver_arrow': 8,
    'bomb': 8,
    'boomerang': 0,  # stuns enemies
    'magic_boomerang': 2,
    'hookshot': 2,
    'fire_rod': 8,
    'ice_rod': 8,
    'hammer': 4,
}

# Item magic costs
ITEM_MAGIC_COST = {
    'fire_rod': 4,
    'ice_rod': 4,
    'bombos': 8,
    'ether': 8,
    'quake': 8,
    'magic_cape': 1,  # per frame
    'cane_of_byrna': 1,
    'cane_of_somaria': 2,
}

# Enemy settings
ENEMY_TYPES = {
    'soldier_green': {'health': 4, 'damage': 2, 'speed': 1, 'behavior': 'patrol'},
    'soldier_blue': {'health': 6, 'damage': 2, 'speed': 1.5, 'behavior': 'chase'},
    'octorok': {'health': 2, 'damage': 2, 'speed': 1, 'behavior': 'shoot'},
    'moblin': {'health': 6, 'damage': 4, 'speed': 1, 'behavior': 'throw'},
    'keese': {'health': 1, 'damage': 1, 'speed': 2, 'behavior': 'fly'},
    'stalfos': {'health': 4, 'damage': 2, 'speed': 1, 'behavior': 'wander'},
    'rope': {'health': 2, 'damage': 2, 'speed': 3, 'behavior': 'charge'},
    'tektite': {'health': 2, 'damage': 2, 'speed': 1, 'behavior': 'jump'},
    'armos': {'health': 6, 'damage': 2, 'speed': 0.5, 'behavior': 'awaken'},
    'buzzblob': {'health': 2, 'damage': 2, 'speed': 0.5, 'behavior': 'electric'},
}

# Keyboard mappings (SNES-style)
CONTROLS = {
    # Movement - Arrow keys or WASD
    'up': ['w', 'up'],
    'down': ['s', 'down'],
    'left': ['a', 'left'],
    'right': ['d', 'right'],

    # Actions
    'sword': ['j', 'z'],         # B button - swing sword
    'item': ['k', 'x'],          # Y button - use selected item
    'action': ['l', 'c'],        # A button - talk, lift, push, run
    'map': ['m', 'tab'],         # X button - view map
    'inventory': ['i', 'return'], # Start - open inventory
    'save_menu': ['escape'],      # Select - save menu

    # Quick select items (number keys)
    'item_1': ['1'],
    'item_2': ['2'],
    'item_3': ['3'],
    'item_4': ['4'],
    'item_5': ['5'],
    'item_6': ['6'],
    'item_7': ['7'],
    'item_8': ['8'],
}

# Animation settings
ANIMATION_SPEED = 100  # milliseconds per frame

# Map/World settings
WORLD_WIDTH = 16  # screens wide
WORLD_HEIGHT = 16  # screens tall
ROOM_WIDTH = 16  # tiles per room width
ROOM_HEIGHT = 14  # tiles per room height (minus HUD space)

# HUD settings
HUD_HEIGHT = 56 * SCALE  # pixels for HUD at top

# Layer ordering (Y-sort)
LAYERS = {
    'ground': 0,
    'floor_decoration': 1,
    'shadow': 2,
    'main': 3,
    'above_main': 4,
    'particles': 5,
    'ui': 6,
}

# Directions
UP = 0
DOWN = 1
LEFT = 2
RIGHT = 3
DIRECTION_VECTORS = {
    UP: (0, -1),
    DOWN: (0, 1),
    LEFT: (-1, 0),
    RIGHT: (1, 0),
}

# Save file path
SAVE_FILE = 'save_data.json'
