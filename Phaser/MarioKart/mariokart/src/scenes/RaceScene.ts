import { Scene3D, ExtendedObject3D, THREE } from '@enable3d/phaser-extension';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  Colors,
  Controls,
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_SMOOTHING,
  CAMERA_LOOK_AHEAD,
  KART_MAX_SPEED,
  KART_ACCELERATION,
  KART_BRAKE_FORCE,
  KART_TURN_SPEED,
  KART_DRIFT_MULTIPLIER,
  KART_FRICTION,
  KART_WIDTH,
  KART_HEIGHT,
  KART_DEPTH,
  TRACK_WIDTH,
  TRACK_LENGTH,
  TRACK_CURVE_RADIUS,
  WALL_HEIGHT,
  TOTAL_LAPS,
  COUNTDOWN_SECONDS,
  AI_KART_COUNT,
  AI_DIFFICULTY,
  ItemType,
} from '../config';
import { KartInput, GameSettings, RaceState, KartState, Vector3, Checkpoint } from '../types';

export class RaceScene extends Scene3D {
  private playerKart!: ExtendedObject3D;
  private aiKarts: ExtendedObject3D[] = [];
  private track!: ExtendedObject3D;
  private walls: ExtendedObject3D[] = [];
  private checkpoints: Checkpoint[] = [];
  private waypoints: Vector3[] = [];

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private currentSpeed = 0;
  private isDrifting = false;
  private driftCharge = 0;

  private raceState: RaceState = {
    isCountdown: true,
    isStarted: false,
    isFinished: false,
    countdown: COUNTDOWN_SECONDS,
    raceTime: 0,
    positions: [],
  };

  private playerState: KartState = {
    id: 'player',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    speed: 0,
    lap: 0,
    checkpoint: 0,
    item: ItemType.NONE,
    isInvincible: false,
    isStunned: false,
    isBoosting: false,
    isDrifting: false,
    driftCharge: 0,
    finishTime: null,
  };

  private aiStates: KartState[] = [];
  private settings!: GameSettings;

  constructor() {
    super({ key: 'RaceScene' });
  }

  init(data: { settings: GameSettings }) {
    this.accessThirdDimension();
    this.settings = data.settings || { difficulty: 'medium', laps: TOTAL_LAPS, aiCount: AI_KART_COUNT };

    // Reset state
    this.currentSpeed = 0;
    this.isDrifting = false;
    this.driftCharge = 0;
    this.aiKarts = [];
    this.walls = [];
    this.aiStates = [];

    this.raceState = {
      isCountdown: true,
      isStarted: false,
      isFinished: false,
      countdown: COUNTDOWN_SECONDS,
      raceTime: 0,
      positions: [],
    };

    this.playerState = {
      id: 'player',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      speed: 0,
      lap: 0,
      checkpoint: 0,
      item: ItemType.NONE,
      isInvincible: false,
      isStunned: false,
      isBoosting: false,
      isDrifting: false,
      driftCharge: 0,
      finishTime: null,
    };
  }

  create() {
    // Setup 3D world
    this.third.warpSpeed('light');

    // Sky
    this.third.scene.background = new THREE.Color(Colors.SKY);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.third.scene.add(ambientLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.third.scene.add(dirLight);

    // Create track
    this.createTrack();

    // Create player kart
    this.createPlayerKart();

    // Create AI karts
    this.createAIKarts();

    // Setup camera
    this.setupCamera();

    // Setup keyboard input
    this.setupInput();

    // Launch UI scene
    this.scene.launch('UIScene', { raceState: this.raceState, playerState: this.playerState });

    // Start countdown
    this.startCountdown();
  }

  private createTrack() {
    // Ground/Grass
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: Colors.GRASS });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.third.scene.add(ground);

    // Create oval track
    this.createOvalTrack();
  }

  private createOvalTrack() {
    const trackWidth = TRACK_WIDTH;
    const straightLength = TRACK_LENGTH;
    const curveRadius = TRACK_CURVE_RADIUS;

    // Track segments (flat boxes for simplicity)
    const trackMaterial = { lambert: { color: Colors.TRACK } };
    const edgeMaterial = { lambert: { color: Colors.TRACK_EDGE } };

    // Straight section 1 (bottom)
    const straight1 = this.third.add.box(
      { x: 0, y: 0.05, z: curveRadius + straightLength / 2, width: trackWidth, height: 0.1, depth: straightLength },
      trackMaterial
    );
    straight1.receiveShadow = true;

    // Straight section 2 (top)
    const straight2 = this.third.add.box(
      { x: 0, y: 0.05, z: -(curveRadius + straightLength / 2), width: trackWidth, height: 0.1, depth: straightLength },
      trackMaterial
    );
    straight2.receiveShadow = true;

    // Create curved sections using multiple small segments
    this.createCurvedSection(0, 0, curveRadius, trackWidth, Math.PI, 0); // Right curve
    this.createCurvedSection(0, 0, curveRadius, trackWidth, Math.PI, Math.PI); // Left curve

    // Create walls
    this.createTrackWalls(trackWidth, straightLength, curveRadius);

    // Create checkpoints and waypoints
    this.createCheckpointsAndWaypoints(trackWidth, straightLength, curveRadius);

    // Create start/finish line
    const startLine = this.third.add.box(
      { x: 0, y: 0.11, z: curveRadius + 10, width: trackWidth, height: 0.02, depth: 2 },
      { lambert: { color: 0xffffff } }
    );
  }

  private createCurvedSection(centerX: number, centerZ: number, radius: number, width: number, arcAngle: number, startAngle: number) {
    const segments = 16;
    const segmentAngle = arcAngle / segments;

    for (let i = 0; i < segments; i++) {
      const angle = startAngle + i * segmentAngle + segmentAngle / 2;
      const x = centerX + Math.sin(angle) * radius;
      const z = centerZ + Math.cos(angle) * radius;

      const segment = this.third.add.box(
        { x, y: 0.05, z, width: width, height: 0.1, depth: (radius * arcAngle) / segments + 1 },
        { lambert: { color: Colors.TRACK } }
      );
      segment.rotation.y = -angle;
      segment.receiveShadow = true;
    }
  }

  private createTrackWalls(trackWidth: number, straightLength: number, curveRadius: number) {
    const wallMaterial = { lambert: { color: Colors.WALL } };
    const hw = trackWidth / 2; // half width

    // Inner walls - straights
    this.walls.push(this.third.add.box(
      { x: -hw + 0.5, y: WALL_HEIGHT / 2, z: curveRadius + straightLength / 2, width: 1, height: WALL_HEIGHT, depth: straightLength },
      wallMaterial
    ));
    this.walls.push(this.third.add.box(
      { x: hw - 0.5, y: WALL_HEIGHT / 2, z: curveRadius + straightLength / 2, width: 1, height: WALL_HEIGHT, depth: straightLength },
      wallMaterial
    ));
    this.walls.push(this.third.add.box(
      { x: -hw + 0.5, y: WALL_HEIGHT / 2, z: -(curveRadius + straightLength / 2), width: 1, height: WALL_HEIGHT, depth: straightLength },
      wallMaterial
    ));
    this.walls.push(this.third.add.box(
      { x: hw - 0.5, y: WALL_HEIGHT / 2, z: -(curveRadius + straightLength / 2), width: 1, height: WALL_HEIGHT, depth: straightLength },
      wallMaterial
    ));

    // Add physics to walls
    this.walls.forEach(wall => {
      this.third.physics.add.existing(wall, { mass: 0 });
    });
  }

  private createCheckpointsAndWaypoints(trackWidth: number, straightLength: number, curveRadius: number) {
    // Create waypoints for AI to follow - around the oval
    const waypointCount = 24;
    this.waypoints = [];

    // Bottom straight
    for (let i = 0; i < 6; i++) {
      const z = curveRadius + straightLength - (i * straightLength / 5);
      this.waypoints.push({ x: 0, y: 1, z });
    }

    // Right curve
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 5;
      this.waypoints.push({
        x: Math.sin(angle) * curveRadius,
        y: 1,
        z: Math.cos(angle) * curveRadius,
      });
    }

    // Top straight
    for (let i = 0; i < 6; i++) {
      const z = -curveRadius - (i * straightLength / 5);
      this.waypoints.push({ x: 0, y: 1, z });
    }

    // Left curve
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI + (i * Math.PI) / 5;
      this.waypoints.push({
        x: Math.sin(angle) * curveRadius,
        y: 1,
        z: -Math.cos(angle) * curveRadius - straightLength,
      });
    }

    // Create checkpoints (subset of waypoints)
    this.checkpoints = [];
    const checkpointIndices = [0, 3, 6, 9, 12, 15, 18, 21];
    checkpointIndices.forEach((idx, i) => {
      const wp = this.waypoints[idx % this.waypoints.length];
      this.checkpoints.push({
        position: wp,
        rotation: 0,
        width: trackWidth,
        index: i,
      });
    });
  }

  private createPlayerKart() {
    // Create kart body
    this.playerKart = this.third.add.box(
      { x: 0, y: KART_HEIGHT / 2 + 0.5, z: TRACK_CURVE_RADIUS + 15, width: KART_WIDTH, height: KART_HEIGHT, depth: KART_DEPTH },
      { lambert: { color: Colors.KART_PLAYER } }
    );
    this.playerKart.castShadow = true;

    // Add physics
    this.third.physics.add.existing(this.playerKart, {
      mass: 100,
      shape: 'box',
    });

    // Prevent flipping
    this.playerKart.body.setAngularFactor(0, 1, 0);
    this.playerKart.body.setFriction(0.5);

    // Add a "driver" on top
    const driver = this.third.add.sphere(
      { x: 0, y: KART_HEIGHT + 0.3, z: -0.3, radius: 0.4 },
      { lambert: { color: 0xffcc99 } }
    );
    this.playerKart.add(driver);

    // Store initial position
    this.playerState.position = {
      x: this.playerKart.position.x,
      y: this.playerKart.position.y,
      z: this.playerKart.position.z,
    };
  }

  private createAIKarts() {
    const aiCount = this.settings.aiCount;

    for (let i = 0; i < aiCount; i++) {
      const color = Colors.KART_AI_COLORS[i % Colors.KART_AI_COLORS.length];
      const xOffset = (i % 2 === 0 ? -5 : 5);
      const zOffset = TRACK_CURVE_RADIUS + 20 + Math.floor(i / 2) * 6;

      const aiKart = this.third.add.box(
        { x: xOffset, y: KART_HEIGHT / 2 + 0.5, z: zOffset, width: KART_WIDTH, height: KART_HEIGHT, depth: KART_DEPTH },
        { lambert: { color } }
      );
      aiKart.castShadow = true;

      this.third.physics.add.existing(aiKart, {
        mass: 100,
        shape: 'box',
      });

      aiKart.body.setAngularFactor(0, 1, 0);
      aiKart.body.setFriction(0.5);

      // Add driver
      const driver = this.third.add.sphere(
        { x: 0, y: KART_HEIGHT + 0.3, z: -0.3, radius: 0.4 },
        { lambert: { color: 0xffcc99 } }
      );
      aiKart.add(driver);

      this.aiKarts.push(aiKart);

      // Initialize AI state
      this.aiStates.push({
        id: `ai_${i}`,
        position: { x: xOffset, y: KART_HEIGHT / 2 + 0.5, z: zOffset },
        rotation: 0,
        speed: 0,
        lap: 0,
        checkpoint: 0,
        item: ItemType.NONE,
        isInvincible: false,
        isStunned: false,
        isBoosting: false,
        isDrifting: false,
        driftCharge: 0,
        finishTime: null,
      });
    }
  }

  private setupCamera() {
    // Position camera behind player
    const kart = this.playerKart;
    this.third.camera.position.set(
      kart.position.x,
      kart.position.y + CAMERA_HEIGHT,
      kart.position.z + CAMERA_DISTANCE
    );
    this.third.camera.lookAt(kart.position.x, kart.position.y, kart.position.z);
  }

  private setupInput() {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      z: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      esc: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };

    // Pause handler
    this.keys.esc.on('down', () => {
      if (this.raceState.isStarted && !this.raceState.isFinished) {
        this.scene.pause();
        this.scene.launch('PauseScene');
      }
    });
  }

  private startCountdown() {
    this.raceState.isCountdown = true;
    this.raceState.countdown = COUNTDOWN_SECONDS;

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.raceState.countdown--;
        if (this.raceState.countdown <= 0) {
          this.raceState.isCountdown = false;
          this.raceState.isStarted = true;
          countdownTimer.destroy();
        }
      },
      repeat: COUNTDOWN_SECONDS,
    });
  }

  private getInput(): KartInput {
    return {
      accelerate: this.keys.up.isDown || this.keys.w.isDown,
      brake: this.keys.down.isDown || this.keys.s.isDown,
      steer: (this.keys.left.isDown || this.keys.a.isDown ? -1 : 0) +
             (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0),
      drift: this.keys.space.isDown,
      useItem: this.keys.z.isDown || this.keys.shift.isDown,
      lookBack: false,
    };
  }

  update(time: number, delta: number) {
    if (!this.playerKart || !this.third.physics) return;

    const deltaSeconds = delta / 1000;

    // Update race time
    if (this.raceState.isStarted && !this.raceState.isFinished) {
      this.raceState.raceTime += delta;
    }

    // Get input
    const input = this.getInput();

    // Update player kart (only if race started)
    if (this.raceState.isStarted && !this.raceState.isFinished) {
      this.updatePlayerKart(input, deltaSeconds);
      this.updateAIKarts(deltaSeconds);
      this.checkCheckpoints();
      this.updatePositions();
    }

    // Update camera
    this.updateCamera(deltaSeconds);

    // Update UI scene
    this.events.emit('updateUI', { raceState: this.raceState, playerState: this.playerState });
  }

  private updatePlayerKart(input: KartInput, delta: number) {
    const kart = this.playerKart;
    const maxSpeed = this.playerState.isBoosting ? KART_MAX_SPEED * 1.5 : KART_MAX_SPEED;

    // Handle drifting
    if (input.drift && Math.abs(this.currentSpeed) > 10) {
      this.isDrifting = true;
      this.driftCharge = Math.min(this.driftCharge + delta * 100, 100);
    } else if (this.isDrifting && !input.drift) {
      // Release drift boost
      if (this.driftCharge > 50) {
        this.playerState.isBoosting = true;
        this.time.delayedCall(500, () => {
          this.playerState.isBoosting = false;
        });
      }
      this.isDrifting = false;
      this.driftCharge = 0;
    }

    // Acceleration / Braking
    if (input.accelerate) {
      this.currentSpeed = Math.min(maxSpeed, this.currentSpeed + KART_ACCELERATION * delta);
    } else if (input.brake) {
      this.currentSpeed = Math.max(-maxSpeed * 0.4, this.currentSpeed - KART_BRAKE_FORCE * delta);
    } else {
      // Friction
      this.currentSpeed *= KART_FRICTION;
      if (Math.abs(this.currentSpeed) < 0.1) this.currentSpeed = 0;
    }

    // Steering (only when moving)
    if (Math.abs(this.currentSpeed) > 0.5) {
      const turnMultiplier = this.isDrifting ? KART_DRIFT_MULTIPLIER : 1;
      const turnAmount = input.steer * KART_TURN_SPEED * turnMultiplier * (this.currentSpeed > 0 ? 1 : -1);

      // Apply rotation
      kart.body.setAngularVelocityY(-turnAmount);
    } else {
      kart.body.setAngularVelocityY(0);
    }

    // Apply forward velocity based on kart's rotation
    const rotation = kart.rotation.y;
    const forward = {
      x: -Math.sin(rotation),
      z: -Math.cos(rotation),
    };

    kart.body.setVelocity(
      forward.x * this.currentSpeed,
      kart.body.velocity.y,
      forward.z * this.currentSpeed
    );

    // Update player state
    this.playerState.position = {
      x: kart.position.x,
      y: kart.position.y,
      z: kart.position.z,
    };
    this.playerState.rotation = rotation;
    this.playerState.speed = this.currentSpeed;
    this.playerState.isDrifting = this.isDrifting;
    this.playerState.driftCharge = this.driftCharge;
  }

  private updateAIKarts(delta: number) {
    const diffSettings = AI_DIFFICULTY[this.settings.difficulty];

    this.aiKarts.forEach((kart, index) => {
      const state = this.aiStates[index];
      if (state.finishTime !== null) return; // AI finished

      // Find target waypoint
      const targetWaypointIndex = (state.checkpoint * 3 + 1) % this.waypoints.length;
      const targetWaypoint = this.waypoints[targetWaypointIndex];

      // Calculate direction to waypoint
      const dx = targetWaypoint.x - kart.position.x;
      const dz = targetWaypoint.z - kart.position.z;
      const targetAngle = Math.atan2(-dx, -dz);

      // Current angle
      const currentAngle = kart.rotation.y;

      // Calculate angle difference
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Steering
      const steerAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) * 2, KART_TURN_SPEED);
      kart.body.setAngularVelocityY(-steerAmount);

      // Speed (based on difficulty)
      const aiSpeed = KART_MAX_SPEED * diffSettings.speedMultiplier;
      state.speed = aiSpeed;

      // Apply velocity
      const rotation = kart.rotation.y;
      const forward = {
        x: -Math.sin(rotation),
        z: -Math.cos(rotation),
      };

      kart.body.setVelocity(
        forward.x * aiSpeed,
        kart.body.velocity.y,
        forward.z * aiSpeed
      );

      // Update state position
      state.position = {
        x: kart.position.x,
        y: kart.position.y,
        z: kart.position.z,
      };
      state.rotation = rotation;
    });
  }

  private checkCheckpoints() {
    // Check player checkpoints
    this.checkpoints.forEach((cp, index) => {
      const dist = this.distance3D(this.playerState.position, cp.position);
      if (dist < TRACK_WIDTH && index === (this.playerState.checkpoint + 1) % this.checkpoints.length) {
        this.playerState.checkpoint = index;

        // Check for lap completion
        if (index === 0 && this.playerState.checkpoint === 0) {
          this.playerState.lap++;
          if (this.playerState.lap >= this.settings.laps) {
            this.playerState.finishTime = this.raceState.raceTime;
            this.checkRaceEnd();
          }
        }
      }
    });

    // Check AI checkpoints
    this.aiStates.forEach((state) => {
      this.checkpoints.forEach((cp, index) => {
        const dist = this.distance3D(state.position, cp.position);
        if (dist < TRACK_WIDTH && index === (state.checkpoint + 1) % this.checkpoints.length) {
          state.checkpoint = index;

          if (index === 0 && state.checkpoint === 0) {
            state.lap++;
            if (state.lap >= this.settings.laps && state.finishTime === null) {
              state.finishTime = this.raceState.raceTime;
              this.checkRaceEnd();
            }
          }
        }
      });
    });
  }

  private updatePositions() {
    // Calculate race positions based on lap and checkpoint progress
    const allRacers = [
      { state: this.playerState, isPlayer: true },
      ...this.aiStates.map(s => ({ state: s, isPlayer: false })),
    ];

    // Sort by: finished first, then lap, then checkpoint
    allRacers.sort((a, b) => {
      // Finished racers first
      if (a.state.finishTime !== null && b.state.finishTime === null) return -1;
      if (a.state.finishTime === null && b.state.finishTime !== null) return 1;
      if (a.state.finishTime !== null && b.state.finishTime !== null) {
        return a.state.finishTime - b.state.finishTime;
      }

      // By lap
      if (a.state.lap !== b.state.lap) return b.state.lap - a.state.lap;

      // By checkpoint
      return b.state.checkpoint - a.state.checkpoint;
    });

    this.raceState.positions = allRacers.map((racer, index) => ({
      id: racer.state.id,
      position: index + 1,
      lap: racer.state.lap,
      checkpoint: racer.state.checkpoint,
      distanceToNextCheckpoint: 0,
      isPlayer: racer.isPlayer,
      finishTime: racer.state.finishTime,
    }));
  }

  private checkRaceEnd() {
    // Race ends when player finishes
    if (this.playerState.finishTime !== null) {
      this.raceState.isFinished = true;

      this.time.delayedCall(2000, () => {
        this.scene.stop('UIScene');
        this.scene.start('ResultsScene', {
          results: this.raceState.positions.map((p, i) => ({
            position: i + 1,
            id: p.id,
            isPlayer: p.isPlayer,
            finishTime: p.finishTime,
            bestLapTime: null,
          })),
          raceTime: this.raceState.raceTime,
        });
      });
    }
  }

  private updateCamera(delta: number) {
    const kart = this.playerKart;
    const rotation = kart.rotation.y;

    // Calculate desired camera position (behind and above kart)
    const targetX = kart.position.x + Math.sin(rotation) * CAMERA_DISTANCE;
    const targetY = kart.position.y + CAMERA_HEIGHT;
    const targetZ = kart.position.z + Math.cos(rotation) * CAMERA_DISTANCE;

    // Smooth camera movement
    this.third.camera.position.x += (targetX - this.third.camera.position.x) * CAMERA_SMOOTHING;
    this.third.camera.position.y += (targetY - this.third.camera.position.y) * CAMERA_SMOOTHING;
    this.third.camera.position.z += (targetZ - this.third.camera.position.z) * CAMERA_SMOOTHING;

    // Look at point ahead of kart
    const lookAtX = kart.position.x - Math.sin(rotation) * CAMERA_LOOK_AHEAD;
    const lookAtZ = kart.position.z - Math.cos(rotation) * CAMERA_LOOK_AHEAD;
    this.third.camera.lookAt(lookAtX, kart.position.y + 1, lookAtZ);
  }

  private distance3D(a: Vector3, b: Vector3): number {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );
  }
}
