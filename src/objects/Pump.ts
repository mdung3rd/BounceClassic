// src/objects/Pump.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Pump đại diện cho ô bơm phồng ('I').
 * Bóng chạm vào sẽ chuyển sang dạng bóng phồng (nếu không bị kẹt trong gạch).
 */
export class Pump extends Phaser.GameObjects.Container {
  private pumpGraphics: Phaser.GameObjects.Graphics;
  private isAnimating: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.pumpGraphics = scene.add.graphics();
    this.drawPump();
    this.add(this.pumpGraphics);

    scene.add.existing(this);
    this.setDepth(4);
  }

  /**
   * Vẽ ô bơm phồng bằng Graphics retro phong cách Nokia:
   * Thùng bơm khí áp suất cao với mũi tên bung nở màu vàng cam
   */
  private drawPump(): void {
    this.pumpGraphics.clear();

    const halfW = PHYSICS_CONFIG.PUMP_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.PUMP_HEIGHT / 2;

    // 1. Đế kim loại
    this.pumpGraphics.fillStyle(0x334155, 1);
    this.pumpGraphics.fillRect(-halfW, halfH - 3, PHYSICS_CONFIG.PUMP_WIDTH, 3);

    // 2. Bình chứa khí màu cam rực rỡ
    this.pumpGraphics.fillStyle(0xea580c, 1);
    this.pumpGraphics.fillRoundedRect(-halfW + 1, -halfH + 2, PHYSICS_CONFIG.PUMP_WIDTH - 2, PHYSICS_CONFIG.PUMP_HEIGHT - 5, 2);

    // 3. Viền sáng khối 3D
    this.pumpGraphics.lineStyle(1, 0xfdba74, 1);
    this.pumpGraphics.strokeRoundedRect(-halfW + 1, -halfH + 2, PHYSICS_CONFIG.PUMP_WIDTH - 2, PHYSICS_CONFIG.PUMP_HEIGHT - 5, 2);

    // 4. Biểu tượng mũi tên bung nở / chữ 'I' màu vàng sáng
    this.pumpGraphics.fillStyle(0xfef08a, 1);
    // Vạch đứng
    this.pumpGraphics.fillRect(-1.5, -3, 3, 7);
    // Chóp nhọn hướng lên
    this.pumpGraphics.fillTriangle(0, -halfH + 4, -3, -1, 3, -1);
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và AABB của ô bơm
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    const halfW = PHYSICS_CONFIG.PUMP_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.PUMP_HEIGHT / 2;

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
   * Hiệu ứng nén nhả khi bóng kích hoạt bơm phồng
   */
  public triggerEffect(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 0.8,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.setScale(1);
        this.isAnimating = false;
      },
    });
  }
}
