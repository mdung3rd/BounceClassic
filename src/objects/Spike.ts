// src/objects/Spike.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Spike đại diện cho gai nhọn ('S').
 * Bóng chạm vào sẽ bị phát nổ và mất 1 mạng.
 */
export class Spike extends Phaser.GameObjects.Container {
  private spikeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.spikeGraphics = scene.add.graphics();
    this.drawSpike();
    this.add(this.spikeGraphics);

    scene.add.existing(this);
    this.setDepth(4);
  }

  /**
   * Vẽ gai nhọn kim loại hình tam giác hướng lên trên bằng Graphics
   */
  private drawSpike(): void {
    this.spikeGraphics.clear();

    const halfTile = PHYSICS_CONFIG.TILE_SIZE / 2;
    const baseY = halfTile; // Đáy gai chạm sát mép dưới của tile
    const tipY = halfTile - PHYSICS_CONFIG.SPIKE_HEIGHT; // Đỉnh gai
    const halfW = PHYSICS_CONFIG.SPIKE_WIDTH / 2;

    // 1. Nửa bên phải: mặt tối kim loại
    this.spikeGraphics.fillStyle(0x475569, 1);
    this.spikeGraphics.fillTriangle(0, tipY, halfW, baseY, 0, baseY);

    // 2. Nửa bên trái: mặt sáng phản quang
    this.spikeGraphics.fillStyle(0x94a3b8, 1);
    this.spikeGraphics.fillTriangle(-halfW, baseY, 0, tipY, 0, baseY);

    // 3. Đường viền gai sắc nhọn
    this.spikeGraphics.lineStyle(1, 0x1e293b, 1);
    this.spikeGraphics.strokeTriangle(-halfW, baseY, 0, tipY, halfW, baseY);

    // 4. Mũi nhọn đỉnh gai màu sáng trắng
    this.spikeGraphics.fillStyle(0xf1f5f9, 1);
    this.spikeGraphics.fillCircle(0, tipY + 1, 1);
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và hộp AABB của gai
   * Sử dụng thuật toán Circle-AABB không dùng physics engine
   *
   * @param bx Tọa độ tâm X của bóng
   * @param by Tọa độ tâm Y của bóng
   * @param br Bán kính của bóng
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    const halfTile = PHYSICS_CONFIG.TILE_SIZE / 2;
    const baseY = this.y + halfTile;
    const tipY = baseY - PHYSICS_CONFIG.SPIKE_HEIGHT;
    const halfW = PHYSICS_CONFIG.SPIKE_WIDTH / 2;

    const minX = this.x - halfW;
    const maxX = this.x + halfW;
    const minY = tipY;
    const maxY = baseY;

    // Tìm điểm gần nhất trên AABB của gai
    const closestX = Math.max(minX, Math.min(bx, maxX));
    const closestY = Math.max(minY, Math.min(by, maxY));

    // Tính khoảng cách
    const dx = bx - closestX;
    const dy = by - closestY;
    return dx * dx + dy * dy <= br * br;
  }
}
