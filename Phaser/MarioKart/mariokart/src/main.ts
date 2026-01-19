import { enable3d, Canvas } from '@enable3d/phaser-extension';
import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { RaceScene } from './scenes/RaceScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultsScene } from './scenes/ResultsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scene: [BootScene, TitleScene, RaceScene, UIScene, PauseScene, ResultsScene],
  parent: 'game-container',
  ...Canvas(),
};

window.addEventListener('load', () => {
  enable3d(() => new Phaser.Game(config)).withPhysics('/ammo');
});

export default config;
