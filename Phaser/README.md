# Mini Game Mania - Phaser Games Launcher

A beautiful, interactive launcher for Phaser 3 games with a modern UI and smooth navigation.

## Features

- 🎮 Beautiful gradient launcher page with animated cards
- 🗡️ Zelda: A Link to the Past clone (fully playable)
- ⚡ Fast hot-reload development with Vite
- 🎨 Responsive design with smooth animations
- 🔄 Easy navigation between launcher and games

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Navigate to the Phaser directory:
```bash
cd MiniGameMania/Phaser
```

2. Install dependencies:
```bash
npm install
```

### Running the Launcher

Start the development server:
```bash
npm run dev
```

The launcher will open automatically at `http://localhost:3000/`

### Available Games

#### Zelda: A Link to the Past Clone
- Click the Zelda card on the launcher to start playing
- Use arrow keys to move
- Press 'Z' or 'J' to attack
- Press 'X' or 'K' to use items
- Press 'ESC' to pause
- Press 'I' to open inventory
- Click "Back to Launcher" button in the top-left to return to the main menu

## Project Structure

```
Phaser/
├── index.html          # Launcher page
├── package.json        # Project dependencies
├── vite.config.js      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── Zelda/              # Zelda game
    └── phaser/         # Game code
        ├── src/        # Source files
        ├── index.html  # Game entry point
        └── ...
```

## Building for Production

Build the project:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Adding More Games

To add a new game to the launcher:

1. Create a new directory under `Phaser/` for your game
2. Add the game's code and assets
3. Update `vite.config.js` to include the new game's entry point
4. Add a new game card to `index.html` in the launcher
5. Update the `launchGame()` function to handle navigation to your new game

## Technologies Used

- **Phaser 3.80.1** - Game framework
- **Vite 5.0.12** - Build tool and dev server
- **TypeScript 5.3.3** - Type-safe development
- **ES Modules** - Modern JavaScript modules

## License

This project is for educational purposes.

## Credits

- Zelda: A Link to the Past is a trademark of Nintendo
- This is a fan-made recreation for learning purposes
