// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { Ball, BallInputState } from '../objects/Ball';
import { LEVEL_1 } from '../levels/level1';
import { LevelData } from '../levels/types';
import { ObjectManager } from '../objects/ObjectManager';
import { HUD } from '../objects/HUD';

export class GameScene extends Phaser.Scene {
  // Dữ liệu bản đồ level hiện tại
  private level: LevelData = LEVEL_1;

  // Đối tượng quả bóng
  private ball!: Ball;

  // Quản lý các đối tượng chơi (Ring, Spike, Checkpoint, ExitGate)
  private objectManager!: ObjectManager;

  // Thanh trạng thái HUD ghim cố định trên màn hình
  private hud!: HUD;

  // RenderTexture để vẽ toàn bộ tilemap gạch một lần duy nhất
  private mapRenderTexture!: Phaser.GameObjects.RenderTexture;

  // Graphics hiển thị viền các ô tile đang va chạm khi bật debug
  private collisionDebugGraphics!: Phaser.GameObjects.Graphics;

  // Trạng thái bật/tắt vẽ viền debug các ô va chạm (phím D)
  private debugCollisionVisible: boolean = false;

  // Container debug overlay
  private debugContainer!: Phaser.GameObjects.Container;
  private debugText!: Phaser.GameObjects.Text;

  // Tích lũy thời gian để chạy fixed timestep 60Hz
  private accumulator: number = 0;

  // Trạng thái tạm dừng game
  private isPaused: boolean = false;
  private pauseContainer!: Phaser.GameObjects.Container;

  // Phím điều khiển
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyP?: Phaser.Input.Keyboard.Key;
  private keyEsc?: Phaser.Input.Keyboard.Key;
  private keyR?: Phaser.Input.Keyboard.Key;
  private keyB?: Phaser.Input.Keyboard.Key;

  // Trạng thái kết thúc game
  private isGameOver: boolean = false;
  private isLevelComplete: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    // Reset cờ kết thúc và cờ tạm dừng
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isPaused = false;
    this.time.paused = false;
    this.accumulator = 0;

    // 1. Vẽ nền bao phủ toàn bộ kích thước của level (40 ô x 20 ô)
    this.createBackground();

    // 2. Vẽ gạch đỏ 16x16 bằng RenderTexture một lần duy nhất lúc nạp level
    this.createTilemapRenderTexture();

    // 3. Khởi tạo quả bóng tại điểm xuất phát 'P' của level
    this.ball = new Ball(this, this.level.spawnX, this.level.spawnY);
    this.ball.setDepth(10);

    // 4. Khởi tạo thanh HUD cố định trên màn hình
    this.hud = new HUD(this);

    // 5. Khởi tạo ObjectManager quản lý Ring, Spike, Checkpoint, ExitGate
    this.objectManager = new ObjectManager(this, this.level, {
      onStatsChange: (lives, remainingRings, score) => {
        this.hud.updateStats(lives, remainingRings, score);
      },
      onGameOver: () => {
        this.handleGameOver();
      },
      onLevelComplete: () => {
        this.handleLevelComplete();
      },
    });

    // Cập nhật số liệu HUD ban đầu
    this.hud.updateStats(
      this.objectManager.lives,
      this.objectManager.remainingRings,
      this.objectManager.score
    );

    // 6. Thiết lập Camera cuộn theo bóng (lerp nhẹ) và giới hạn trong biên level
    this.setupCamera();

    // 7. Khởi tạo graphics cho việc vẽ viền các ô tile va chạm
    this.collisionDebugGraphics = this.add.graphics();
    this.collisionDebugGraphics.setDepth(20);

    // 8. Thiết lập các phím điều khiển (Mũi tên, A/D, W, Space, P, Esc, R, và B cho Debug)
    if (this.input.keyboard) {
      this.input.keyboard.resetKeys();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    }

    // Lắng nghe click / chạm màn hình để chơi lại khi game over hoặc win
    this.input.on('pointerdown', () => {
      if (this.isGameOver || this.isLevelComplete) {
        this.restartGame();
      }
    });

    // 9. Tạo pause overlay ghim cố định trên màn hình (mặc định ẩn)
    this.createPauseOverlay();

    // 10. Tạo debug overlay ghim cố định trên màn hình (mặc định ẩn)
    this.createDebugOverlay();
  }

  /**
   * Tạo nền bầu trời xanh tối và lưới mờ pixel cho toàn bộ level
   */
  private createBackground(): void {
    const bg = this.add.graphics();
    bg.setDepth(0);
    bg.fillStyle(0x131722, 1);
    bg.fillRect(0, 0, this.level.widthPx, this.level.heightPx);

    // Kẻ lưới mờ từng ô 16x16 trên toàn bộ level
    bg.lineStyle(1, 0x1f2438, 0.5);
    for (let x = 0; x <= this.level.widthPx; x += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(x, 0, x, this.level.heightPx);
    }
    for (let y = 0; y <= this.level.heightPx; y += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(0, y, this.level.widthPx, y);
    }
  }

  /**
   * Vẽ tile 16x16 bằng RenderTexture (gạch đỏ có viền đậm hơn).
   * Chỉ vẽ đúng 1 lần khi load level, không vẽ lại mỗi frame.
   */
  private createTilemapRenderTexture(): void {
    const tileSize = PHYSICS_CONFIG.TILE_SIZE;

    this.mapRenderTexture = this.add.renderTexture(
      0,
      0,
      this.level.widthPx,
      this.level.heightPx
    );
    this.mapRenderTexture.setOrigin(0, 0);
    this.mapRenderTexture.setDepth(1);
    this.mapRenderTexture.renderMode = 'all';

    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        if (this.level.grid[y][x] === '#') {
          const px = x * tileSize;
          const py = y * tileSize;

          // 1. Thân gạch đỏ tươi
          this.mapRenderTexture.fill(0xb83227, 1, px, py, tileSize, tileSize);

          // 2. Viền trên và viền trái sáng nhẹ tạo khối nổi
          this.mapRenderTexture.fill(0xd64536, 1, px, py, tileSize, 1);
          this.mapRenderTexture.fill(0xd64536, 1, px, py, 1, tileSize);

          // 3. Viền dưới và viền phải sẫm màu tạo bóng đổ
          this.mapRenderTexture.fill(0x6e1b15, 1, px, py + tileSize - 1, tileSize, 1);
          this.mapRenderTexture.fill(0x6e1b15, 1, px + tileSize - 1, py, 1, tileSize);

          // 4. Mạch vữa chia đôi viên gạch phong cách Nokia Bounce
          this.mapRenderTexture.fill(0x6e1b15, 1, px + 7, py + 2, 2, tileSize - 4);
        }
      }
    }

    this.mapRenderTexture.render();
  }

  /**
   * Cấu hình Camera bám theo bóng với lerp nhẹ và giới hạn biên level
   */
  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
    this.cameras.main.startFollow(
      this.ball,
      true,
      PHYSICS_CONFIG.CAMERA_LERP_X,
      PHYSICS_CONFIG.CAMERA_LERP_Y
    );
  }

  /**
   * Khởi tạo overlay khi tạm dừng game (PAUSED)
   */
  private createPauseOverlay(): void {
    this.pauseContainer = this.add.container(0, 0);
    this.pauseContainer.setScrollFactor(0);
    this.pauseContainer.setDepth(300);
    this.pauseContainer.setVisible(false);

    // Lớp phủ mờ tối toàn bộ màn hình
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, PHYSICS_CONFIG.LOGIC_WIDTH, PHYSICS_CONFIG.LOGIC_HEIGHT);
    this.pauseContainer.add(bg);

    // Hộp thông báo trung tâm
    const box = this.add.graphics();
    box.fillStyle(0x0f172a, 0.95);
    box.fillRoundedRect(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2 - 150,
      PHYSICS_CONFIG.LOGIC_HEIGHT / 2 - 45,
      300,
      90,
      6
    );
    box.lineStyle(2, 0x38bdf8, 0.85);
    box.strokeRoundedRect(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2 - 150,
      PHYSICS_CONFIG.LOGIC_HEIGHT / 2 - 45,
      300,
      90,
      6
    );
    this.pauseContainer.add(box);

    const title = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      PHYSICS_CONFIG.LOGIC_HEIGHT / 2 - 18,
      'PAUSED',
      {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f8fafc',
      }
    );
    title.setOrigin(0.5);
    this.pauseContainer.add(title);

    const hint = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      PHYSICS_CONFIG.LOGIC_HEIGHT / 2 + 20,
      'P/Esc: tiếp tục | R: chơi lại màn',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#94a3b8',
      }
    );
    hint.setOrigin(0.5);
    this.pauseContainer.add(hint);
  }

  /**
   * Bật/tắt trạng thái tạm dừng game
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.time.paused = true;
      this.tweens.pauseAll();
      this.pauseContainer.setVisible(true);
    } else {
      this.time.paused = false;
      this.tweens.resumeAll();
      this.accumulator = 0; // Reset accumulator của fixed timestep khi thoát pause
      this.pauseContainer.setVisible(false);
    }
  }

  /**
   * Khởi tạo overlay debug, ghim cố định ở góc màn hình (mặc định ẩn)
   */
  private createDebugOverlay(): void {
    this.debugContainer = this.add.container(4, 22);
    this.debugContainer.setScrollFactor(0);
    this.debugContainer.setDepth(100);
    this.debugContainer.setVisible(false);

    const overlayBg = this.add.graphics();
    overlayBg.fillStyle(0x000000, 0.75);
    overlayBg.fillRoundedRect(0, 0, 184, 86, 4);
    overlayBg.lineStyle(1, 0x334155, 0.8);
    overlayBg.strokeRoundedRect(0, 0, 184, 86, 4);
    this.debugContainer.add(overlayBg);

    this.debugText = this.add.text(4, 4, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#00ff88',
      lineSpacing: 2,
    });
    this.debugContainer.add(this.debugText);
  }

  /**
   * Đọc trạng thái input từ bàn phím.
   */
  private getInputState(): BallInputState {
    const left = Boolean(this.cursors?.left?.isDown || this.keyA?.isDown);
    const right = Boolean(this.cursors?.right?.isDown || this.keyD?.isDown);
    const jump = Boolean(
      this.cursors?.up?.isDown ||
      this.cursors?.space?.isDown ||
      this.keyW?.isDown ||
      this.keySpace?.isDown
    );

    return { left, right, jump };
  }

  /**
   * Vòng lặp cập nhật chính của Phaser
   */
  public update(_time: number, delta: number): void {
    // 1. Phím R: chơi lại màn hiện tại từ đầu (hoạt động khi đang chơi, tạm dừng, hoặc Game Over / Level Complete)
    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartGame();
      return;
    }

    // 2. Phím P hoặc Esc: bật/tắt tạm dừng game (chỉ khi chưa Game Over và chưa hoàn thành màn)
    if (
      (this.keyP && Phaser.Input.Keyboard.JustDown(this.keyP)) ||
      (this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc))
    ) {
      if (!this.isGameOver && !this.isLevelComplete) {
        this.togglePause();
        return;
      }
    }

    // 3. Nếu đang tạm dừng: dừng mọi cập nhật vật lý, kẻ địch, hiệu ứng
    if (this.isPaused) {
      return;
    }

    // 4. Nếu game đã kết thúc (Game Over hoặc Win), kiểm tra bấm Space để chơi lại
    if (this.isGameOver || this.isLevelComplete) {
      if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.restartGame();
      }
      return;
    }

    // 5. Xử lý phím B bật/tắt vẽ viền debug và overlay debug
    if (this.keyB && Phaser.Input.Keyboard.JustDown(this.keyB)) {
      this.debugCollisionVisible = !this.debugCollisionVisible;
      this.debugContainer.setVisible(this.debugCollisionVisible);
    }

    // 6. Giới hạn delta tối đa để tránh spiral-of-death
    const dt = Math.min(delta, 100);
    const dtSec = dt / 1000;
    this.accumulator += dt;

    const inputState = this.getInputState();

    // Tiêu thụ thời gian tích lũy với bước cố định 60Hz
    while (this.accumulator >= PHYSICS_CONFIG.FIXED_TIMESTEP) {
      this.ball.fixedUpdate(inputState, PHYSICS_CONFIG.FIXED_DELTA_TIME, this.level);
      this.accumulator -= PHYSICS_CONFIG.FIXED_TIMESTEP;
    }

    // Cập nhật va chạm giữa bóng và các đối tượng chơi (Ring, Spike, Checkpoint, ExitGate, Pump, Deflater, Bouncer, Enemy, Water)
    this.objectManager.update(this.ball, dtSec);

    // Vẽ viền debug các ô va chạm nếu cờ debug đang bật
    if (this.debugCollisionVisible) {
      this.renderCollisionDebug();
      this.updateDebugOverlay();
    } else {
      this.collisionDebugGraphics.clear();
    }
  }

  /**
   * Vẽ viền nổi bật quanh các ô tile đang va chạm với bóng trong frame vừa rồi
   */
  private renderCollisionDebug(): void {
    this.collisionDebugGraphics.clear();

    if (this.ball.collidingTiles.length > 0) {
      const tileSize = PHYSICS_CONFIG.TILE_SIZE;
      this.collisionDebugGraphics.lineStyle(1.5, 0xffea00, 1);

      for (const tile of this.ball.collidingTiles) {
        this.collisionDebugGraphics.strokeRect(
          tile.x * tileSize,
          tile.y * tileSize,
          tileSize,
          tileSize
        );
      }
    }
  }

  /**
   * Cập nhật nội dung debug overlay bao gồm tọa độ ô (tileX, tileY)
   */
  private updateDebugOverlay(): void {
    const tileX = Math.floor(this.ball.x / PHYSICS_CONFIG.TILE_SIZE);
    const tileY = Math.floor(this.ball.y / PHYSICS_CONFIG.TILE_SIZE);

    const vxStr = (this.ball.vx >= 0 ? '+' : '') + this.ball.vx.toFixed(1);
    const vyStr = (this.ball.vy >= 0 ? '+' : '') + this.ball.vy.toFixed(1);
    const groundStatus = this.ball.onGround ? 'TRUE' : 'false';
    const formStr = this.ball.form.toUpperCase();
    const waterStr = this.ball.isInWater ? 'IN WATER' : 'AIR';
    const debugModeStr = this.debugCollisionVisible ? 'ON' : 'OFF';

    this.debugText.setText(
      `[DEBUG OVERLAY]\n` +
      `tile:     (${tileX}, ${tileY})\n` +
      `pos:      (${this.ball.x.toFixed(0)}, ${this.ball.y.toFixed(0)})\n` +
      `form:     ${formStr} (r=${this.ball.radius}) | ${waterStr}\n` +
      `vx:       ${vxStr} px/s\n` +
      `vy:       ${vyStr} px/s\n` +
      `onGround: ${groundStatus}\n` +
      `[B] Debug: ${debugModeStr}\n` +
      `Arrows / A-D: Move | Space/W: Jump`
    );
  }

  /**
   * Xử lý hiển thị màn hình Game Over khi hết mạng
   */
  private handleGameOver(): void {
    this.isGameOver = true;

    const overlay = this.add.container(0, 0);
    overlay.setScrollFactor(0);
    overlay.setDepth(200);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.82);
    bg.fillRect(0, 0, PHYSICS_CONFIG.LOGIC_WIDTH, PHYSICS_CONFIG.LOGIC_HEIGHT);
    overlay.add(bg);

    const title = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      120,
      'GAME OVER',
      {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ef4444',
      }
    );
    title.setOrigin(0.5);
    overlay.add(title);

    const sub = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      150,
      'HẾT MẠNG!',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#94a3b8',
      }
    );
    sub.setOrigin(0.5);
    overlay.add(sub);

    const hint = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      190,
      'BẤM R / SPACE HOẶC CHẠM ĐỂ CHƠI LẠI',
      {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#38bdf8',
      }
    );
    hint.setOrigin(0.5);
    overlay.add(hint);

    // Hiệu ứng nhấp nháy cho text hướng dẫn
    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Xử lý hiển thị màn hình Level Complete khi chạm cổng thoát đã mở
   */
  private handleLevelComplete(): void {
    this.isLevelComplete = true;

    const overlay = this.add.container(0, 0);
    overlay.setScrollFactor(0);
    overlay.setDepth(200);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.82);
    bg.fillRect(0, 0, PHYSICS_CONFIG.LOGIC_WIDTH, PHYSICS_CONFIG.LOGIC_HEIGHT);
    overlay.add(bg);

    const title = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      110,
      'LEVEL COMPLETE',
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#facc15',
      }
    );
    title.setOrigin(0.5);
    overlay.add(title);

    const scoreText = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      145,
      `TỔNG ĐIỂM: ${this.objectManager.score}`,
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#4ade80',
      }
    );
    scoreText.setOrigin(0.5);
    overlay.add(scoreText);

    const hint = this.add.text(
      PHYSICS_CONFIG.LOGIC_WIDTH / 2,
      190,
      'BẤM R / SPACE HOẶC CHẠM ĐỂ CHƠI LẠI',
      {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#38bdf8',
      }
    );
    hint.setOrigin(0.5);
    overlay.add(hint);

    // Hiệu ứng nhấp nháy cho text hướng dẫn
    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Khởi động lại màn chơi hiện tại
   */
  private restartGame(): void {
    if (this.isPaused) {
      this.time.paused = false;
      this.tweens.resumeAll();
      this.isPaused = false;
    }
    this.scene.restart();
  }
}
