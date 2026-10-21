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

    // 1. Khối bục gạch nền cam đậm (16x16px kiên cố)
    this.pumpGraphics.fillStyle(0xc2410c, 1);
    this.pumpGraphics.fillRect(-halfW, -halfH, 16, 16);

    // 2. Viền sáng khối 3D (phía trên và bên trái)
    this.pumpGraphics.fillStyle(0xfdba74, 1);
    this.pumpGraphics.fillRect(-halfW, -halfH, 16, 1);
    this.pumpGraphics.fillRect(-halfW, -halfH, 1, 16);

    // 3. Viền tối đổ bóng (phía dưới và bên phải)
    this.pumpGraphics.fillStyle(0x7c2d12, 1);
    this.pumpGraphics.fillRect(-halfW, halfH - 1, 16, 1);
    this.pumpGraphics.fillRect(halfW - 1, -halfH, 1, 16);

    // 4. Đế kim loại chịu lực ở đáy
    this.pumpGraphics.fillStyle(0x334155, 1);
    this.pumpGraphics.fillRect(-halfW + 1, halfH - 3, 14, 2);

    // 5. Thân trung tâm bình khí nén áp suất cao
    this.pumpGraphics.fillStyle(0xea580c, 1);
    this.pumpGraphics.fillRoundedRect(-halfW + 2, -halfH + 2, 12, 10, 1);

    // 6. Biểu tượng mũi tên bung nở màu vàng sáng
    this.pumpGraphics.fillStyle(0xfef08a, 1);
    // Vạch đứng
    this.pumpGraphics.fillRect(-1.5, -2, 3, 5);
    // Chóp nhọn hướng lên
    this.pumpGraphics.fillTriangle(0, -6, -3.5, -1, 3.5, -1);
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và AABB của ô bơm (có dung sai khi đứng trên bệ)
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
    const effectiveRadius = br + 1.5;
    return dx * dx + dy * dy <= effectiveRadius * effectiveRadius;
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
