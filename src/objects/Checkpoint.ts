// src/objects/Checkpoint.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Checkpoint đại diện cho điểm kiểm tra ('C').
 * Khi bóng chạm vào, lưu vị trí hồi sinh và đổi màu sang xanh lá.
 */
export class Checkpoint extends Phaser.GameObjects.Container {
  public isActivated: boolean = false;
  private checkpointGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.checkpointGraphics = scene.add.graphics();
    this.drawCheckpoint();
    this.add(this.checkpointGraphics);

    scene.add.existing(this);
    this.setDepth(3);
  }

  /**
   * Vẽ cột mốc Checkpoint chuẩn retro bằng Graphics
   */
  private drawCheckpoint(): void {
    this.checkpointGraphics.clear();

    const halfTile = PHYSICS_CONFIG.TILE_SIZE / 2;
    const baseY = halfTile;

    // 1. Đế cột mốc (màu xám đậm)
    this.checkpointGraphics.fillStyle(0x334155, 1);
    this.checkpointGraphics.fillRect(-5, baseY - 3, 10, 3);

    // 2. Thân cột kim loại (màu xám bạc)
    this.checkpointGraphics.fillStyle(0x94a3b8, 1);
    this.checkpointGraphics.fillRect(-1.5, baseY - 15, 3, 12);

    if (this.isActivated) {
      // Đã kích hoạt: Cờ xanh lá cây sáng nổi bật
      this.checkpointGraphics.fillStyle(0x22c55e, 1);
      this.checkpointGraphics.fillTriangle(0, baseY - 15, 7, baseY - 11, 0, baseY - 7);

      // Quả cầu tín hiệu trên đỉnh cột màu xanh ngọc
      this.checkpointGraphics.fillStyle(0x4ade80, 1);
      this.checkpointGraphics.fillCircle(0, baseY - 15, 2.5);

      // Vòng sáng nhẹ
      this.checkpointGraphics.lineStyle(1, 0x86efac, 0.8);
      this.checkpointGraphics.strokeCircle(0, baseY - 15, 3.5);
    } else {
      // Chưa kích hoạt: Cờ đỏ/xám sẫm
      this.checkpointGraphics.fillStyle(0xef4444, 0.9);
      this.checkpointGraphics.fillTriangle(0, baseY - 15, 7, baseY - 11, 0, baseY - 7);

      // Quả cầu tín hiệu trên đỉnh cột màu đỏ sẫm
      this.checkpointGraphics.fillStyle(0x991b1b, 1);
      this.checkpointGraphics.fillCircle(0, baseY - 15, 2.5);
    }
  }

  /**
   * Kích hoạt checkpoint
   */
  public activate(): boolean {
    if (this.isActivated) return false;

    this.isActivated = true;
    this.drawCheckpoint();

    // Hiệu ứng nảy nhẹ khi vừa kích hoạt
    this.scene.tweens.add({
      targets: this,
      scaleY: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
    });

    return true;
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và Checkpoint
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    const halfW = PHYSICS_CONFIG.CHECKPOINT_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.CHECKPOINT_HEIGHT / 2;

    const minX = this.x - halfW;
    const maxX = this.x + halfW;
    const minY = this.y - halfH;
    const maxY = this.y + halfH;

    const closestX = Math.max(minX, Math.min(bx, maxX));
    const closestY = Math.max(minY, Math.min(by, maxY));

    const dx = bx - closestX;
    const dy = by - closestY;
    return dx * dx + dy * dy <= br * br;
  }

  /**
   * Reset checkpoint khi chơi lại từ đầu
   */
  public reset(): void {
    this.isActivated = false;
    this.setScale(1);
    this.drawCheckpoint();
  }
}
