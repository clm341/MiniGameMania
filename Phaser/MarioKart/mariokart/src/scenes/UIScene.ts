import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, UI_PADDING, TOTAL_LAPS, ItemType } from '../config';
import { RaceState, KartState } from '../types';

export class UIScene extends Phaser.Scene {
  private positionText!: Phaser.GameObjects.Text;
  private lapText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private itemDisplay!: Phaser.GameObjects.Text;
  private driftMeter!: Phaser.GameObjects.Graphics;
  private finishText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Position display (top-left)
    this.positionText = this.add.text(UI_PADDING, UI_PADDING, '1st', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Lap counter (below position)
    this.lapText = this.add.text(UI_PADDING, UI_PADDING + 60, `Lap 0/${TOTAL_LAPS}`, {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });

    // Race time (top-center)
    this.timeText = this.add.text(SCREEN_WIDTH / 2, UI_PADDING, '0:00.000', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.timeText.setOrigin(0.5, 0);

    // Speed display (bottom-right)
    this.speedText = this.add.text(SCREEN_WIDTH - UI_PADDING, SCREEN_HEIGHT - UI_PADDING, '0 km/h', {
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.speedText.setOrigin(1, 1);

    // Item display (top-right)
    this.itemDisplay = this.add.text(SCREEN_WIDTH - UI_PADDING, UI_PADDING, '', {
      fontSize: '48px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.itemDisplay.setOrigin(1, 0);

    // Drift meter (bottom-center)
    this.driftMeter = this.add.graphics();

    // Countdown text (center)
    this.countdownText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, '', {
      fontSize: '128px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    this.countdownText.setOrigin(0.5, 0.5);

    // Finish text
    this.finishText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, '', {
      fontSize: '72px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.finishText.setOrigin(0.5, 0.5);
    this.finishText.setVisible(false);

    // Listen for updates from RaceScene
    const raceScene = this.scene.get('RaceScene');
    raceScene.events.on('updateUI', this.updateUI, this);
  }

  private updateUI(data: { raceState: RaceState; playerState: KartState }) {
    const { raceState, playerState } = data;

    // Update countdown
    if (raceState.isCountdown) {
      if (raceState.countdown > 0) {
        this.countdownText.setText(raceState.countdown.toString());
        this.countdownText.setColor('#ff0000');
      } else {
        this.countdownText.setText('GO!');
        this.countdownText.setColor('#00ff00');
        this.time.delayedCall(500, () => {
          this.countdownText.setText('');
        });
      }
    } else {
      this.countdownText.setText('');
    }

    // Update position
    const playerPosition = raceState.positions.find(p => p.isPlayer);
    if (playerPosition) {
      const suffix = this.getOrdinalSuffix(playerPosition.position);
      this.positionText.setText(`${playerPosition.position}${suffix}`);
    }

    // Update lap
    this.lapText.setText(`Lap ${Math.min(playerState.lap + 1, TOTAL_LAPS)}/${TOTAL_LAPS}`);

    // Update time
    const time = raceState.raceTime;
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const ms = Math.floor(time % 1000);
    this.timeText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`);

    // Update speed (convert to km/h for display)
    const kmh = Math.abs(Math.round(playerState.speed * 3.6));
    this.speedText.setText(`${kmh} km/h`);

    // Update item display
    this.updateItemDisplay(playerState.item);

    // Update drift meter
    this.updateDriftMeter(playerState.isDrifting, playerState.driftCharge);

    // Show finish text
    if (raceState.isFinished && playerState.finishTime !== null) {
      this.finishText.setText('FINISH!');
      this.finishText.setVisible(true);
    }
  }

  private updateItemDisplay(item: ItemType) {
    const itemEmojis: Record<ItemType, string> = {
      [ItemType.NONE]: '',
      [ItemType.MUSHROOM]: '🍄',
      [ItemType.GREEN_SHELL]: '🟢',
      [ItemType.RED_SHELL]: '🔴',
      [ItemType.BANANA]: '🍌',
      [ItemType.STAR]: '⭐',
    };
    this.itemDisplay.setText(itemEmojis[item]);
  }

  private updateDriftMeter(isDrifting: boolean, driftCharge: number) {
    this.driftMeter.clear();

    if (isDrifting && driftCharge > 0) {
      const meterWidth = 200;
      const meterHeight = 20;
      const x = (SCREEN_WIDTH - meterWidth) / 2;
      const y = SCREEN_HEIGHT - 80;

      // Background
      this.driftMeter.fillStyle(0x333333, 0.8);
      this.driftMeter.fillRect(x, y, meterWidth, meterHeight);

      // Fill based on charge
      let fillColor = 0x0088ff; // Blue
      if (driftCharge > 50) fillColor = 0xff8800; // Orange
      if (driftCharge > 80) fillColor = 0xff0088; // Pink

      this.driftMeter.fillStyle(fillColor, 1);
      this.driftMeter.fillRect(x, y, (meterWidth * driftCharge) / 100, meterHeight);

      // Border
      this.driftMeter.lineStyle(2, 0xffffff, 1);
      this.driftMeter.strokeRect(x, y, meterWidth, meterHeight);
    }
  }

  private getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }
}
