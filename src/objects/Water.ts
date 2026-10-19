// src/objects/Water.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Water đại diện cho ô nước ('~') trong Bounce.
 * Quả bóng phồng trong nước sẽ nổi lên, bóng nhỏ sẽ chìm chậm,
 * và tốc độ di chuyển ngang trong nước chậm hơn.
 */
export class Water extends Phaser.GameObjects.Container {
  private waterGraphics: Phaser.GameObjects.Graphics;
  private wavePhase: number = 0;
  private isSurface: boolean;

  /**
   * @param scene Phaser Scene
   * @param x Tọa độ X tâm ô
   * @param y Tọa độ Y tâm ô
   * @param isSurface Có phải là ô mặt nước trên cùng hay không
   */
  constructor(scene: Phaser.Scene, x: number, y: number, isSurface: boolean = true) {
    super(scene, x, y);
    this.isSurface = isSurface;
    this.wavePhase = Math.random() * Math.PI * 2;

    this.waterGraphics = scene.add.graphics();
    this.drawWater();
    this.add(this.waterGraphics);

    scene.add.existing(this);
    // Độ sâu 6: nằm trên nền và gạch, bóng ở độ sâu 10 vẫn nhìn thấy rõ
    this.setDepth(6);
  }

  /**
   * Vẽ ô nước bằng Graphics với hiệu ứng gợn sóng mặt nước
   */
  private drawWater(): void {
    this.waterGraphics.clear();

    const size = PHYSICS_CONFIG.TILE_SIZE;
    const half = size / 2;

    // 1. Nền nước xanh ngọc trong suốt liền mạch
    this.waterGraphics.fillStyle(0x0284c7, 0.5);
    this.waterGraphics.fillRect(-half, -half, size, size);

    // 2. Nếu là ô mặt nước (hàng trên cùng): vẽ đường sóng lăn tăn màu xanh sáng
    if (this.isSurface) {
      const waveOffset = Math.sin(this.wavePhase) * 1.5;
      this.waterGraphics.lineStyle(2, 0x7dd3fc, 0.85);
      this.waterGraphics.lineBetween(-half, -half + 2 + waveOffset, half, -half + 2 - waveOffset);

      // Điểm bọt nước sáng
      this.waterGraphics.fillStyle(0xffffff, 0.6);
      this.waterGraphics.fillCircle(0, -half + 2 + waveOffset, 1);
    }
  }

  /**
   * Cập nhật chuyển động lăn tăn của mặt nước
   */
  public updateWater(dt: number): void {
    if (!this.isSurface) return;

    this.wavePhase += dt * 4;
    this.drawWater();
  }
}
