#!/usr/bin/env python3
"""
Zelda: A Link to the Past Clone
A top-down action-adventure game inspired by the SNES classic.
"""

import pygame
import sys
from settings import *
from game import Game


def main():
    # Initialize pygame
    pygame.init()
    pygame.mixer.init()

    # Set up display
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Zelda: A Link to the Past Clone")

    # Set up clock
    clock = pygame.time.Clock()

    # Create game instance
    game = Game(screen)

    # Main game loop
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            game.handle_event(event)

        # Update game state
        dt = clock.tick(FPS) / 1000.0  # Delta time in seconds
        game.update(dt)

        # Draw
        game.draw()
        pygame.display.flip()

    # Clean up
    pygame.quit()
    sys.exit()


if __name__ == '__main__':
    main()
