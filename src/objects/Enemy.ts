// src/objects/Enemy.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Enemy đại diện cho kẻ địch gai xoay ('M') trong Bounce.
 * Tự động di chuyển qua lại trên một đoạn đường cố định (minX..maxX),
 * gai xoay tròn liên tục, nếu bóng chạm vào sẽ phát nổ mất mạng giống gai.
 */
export class Enemy extends Phaser.GameObjects.Container {
  public minX: number;
  public maxX: number;
  public vx: number;

  private spikeGraphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    minX: number,
    maxX: number,
    speed: number = PHYSICS_CONFIG.ENEMY_SPEED
  ) {
    super(scene, startX, startY);

    this.minX = minX;
    this.maxX = maxX;
    // Bắt đầu di chuyển sang phải
    this.vx = speed;

    this.spikeGraphics = scene.add.graphics();
    this.drawSpikyEnemy();
    this.add(this.spikeGraphics);

    scene.add.existing(this);
    this.setDepth(5);
  }

  /**
   * Vẽ quả cầu gai xoay nguy hiểm chuẩn phong cách retro Nokia Bounce:
   * Tâm cầu tròn tối màu với gai nhọn tam giác xung quanh
   */
  private drawSpikyEnemy(): void {
    this.spikeGraphics.clear();

    const coreRadius = PHYSICS_CONFIG.ENEMY_RADIUS - 2;
    const spikeLength = PHYSICS_CONFIG.ENEMY_SPIKE_LENGTH;
    const numSpikes = 8;

    // 1. Vẽ các gai nhọn xung quanh
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i * Math.PI * 2) / numSpikes;
      const nextAngle = ((i + 0.4) * Math.PI * 2) / numSpikes;
      const prevAngle = ((i - 0.4) * Math.PI * 2) / numSpikes;

      const tipDist = coreRadius + spikeLength + 1;
      const tipX = Math.cos(angle) * tipDist;
      const tipY = Math.sin(angle) * tipDist;

      const base1X = Math.cos(prevAngle) * coreRadius;
      const base1Y = Math.sin(prevAngle) * coreRadius;
      const base2X = Math.cos(nextAngle) * coreRadius;
      const base2Y = Math.sin(nextAngle) * coreRadius;

      // Gai màu vàng cam sắc nhọn
      this.spikeGraphics.fillStyle(0xf59e0b, 1);
      this.spikeGraphics.fillTriangle(tipX, tipY, base1X, base1Y, base2X, base2Y);

      // Viền gai sẫm màu
      this.spikeGraphics.lineStyle(1, 0xb45309, 1);
      this.spikeGraphics.strokeTriangle(tipX, tipY, base1X, base1Y, base2X, base2Y);
    }

    // 2. Thân cầu kim loại ở giữa
    this.spikeGraphics.fillStyle(0x1e293b, 1);
    this.spikeGraphics.fillCircle(0, 0, coreRadius);

    this.spikeGraphics.lineStyle(1.5, 0xef4444, 1);
    this.spikeGraphics.strokeCircle(0, 0, coreRadius);

    // 3. Mắt quỷ đỏ rực ở tâm
    this.spikeGraphics.fillStyle(0xdc2626, 1);
    this.spikeGraphics.fillCircle(0, 0, 2.5);

    this.spikeGraphics.fillStyle(0xffffff, 0.9);
    this.spikeGraphics.fillCircle(-0.8, -0.8, 0.8);
  }

  /**
   * Cập nhật chuyển động tuần tra và xoay tròn gai
   *
   * @param dt Bước thời gian (giây)
   */
  public updateEnemy(dt: number): void {
    // 1. Di chuyển vị trí X
    this.x += this.vx * dt;

    // Đảo chiều khi chạm giới hạn biên tuần tra
    if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.vx = -Math.abs(this.vx);
    } else if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = Math.abs(this.vx);
    }

    // 2. Xoay tròn đồ họa gai liên tục
    this.spikeGraphics.rotation += PHYSICS_CONFIG.ENEMY_ROTATION_SPEED * dt;
  }

  /**
   * Kiểm tra va chạm hình tròn giữa bóng và kẻ địch
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    const totalRadius = br + PHYSICS_CONFIG.ENEMY_RADIUS;
    const dx = bx - this.x;
    const dy = by - this.y;
    return dx * dx + dy * dy <= totalRadius * totalRadius;
  }
}
