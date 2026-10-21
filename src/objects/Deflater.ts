// src/objects/Deflater.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Deflater đại diện cho ô xì xẹp ('D').
 * Bóng chạm vào sẽ chuyển từ dạng bóng phồng về dạng bóng nhỏ.
 */
export class Deflater extends Phaser.GameObjects.Container {
  private deflaterGraphics: Phaser.GameObjects.Graphics;
  private isAnimating: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.deflaterGraphics = scene.add.graphics();
    this.drawDeflater();
    this.add(this.deflaterGraphics);

    scene.add.existing(this);
    this.setDepth(4);
  }

  /**
   * Vẽ ô xì xẹp bằng Graphics retro phong cách Nokia:
   * Ống hút/van xả áp suất màu xanh lam với mũi tên hướng xuống
   */
  private drawDeflater(): void {
    this.deflaterGraphics.clear();

    const halfW = PHYSICS_CONFIG.DEFLATER_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.DEFLATER_HEIGHT / 2;

    // 1. Khối bục gạch nền xanh dương đậm (16x16px kiên cố)
    this.deflaterGraphics.fillStyle(0x0369a1, 1);
    this.deflaterGraphics.fillRect(-halfW, -halfH, 16, 16);

    // 2. Viền sáng khối 3D (phía trên và bên trái)
    this.deflaterGraphics.fillStyle(0x7dd3fc, 1);
    this.deflaterGraphics.fillRect(-halfW, -halfH, 16, 1);
    this.deflaterGraphics.fillRect(-halfW, -halfH, 1, 16);

    // 3. Viền tối đổ bóng (phía dưới và bên phải)
    this.deflaterGraphics.fillStyle(0x0c4a6e, 1);
    this.deflaterGraphics.fillRect(-halfW, halfH - 1, 16, 1);
    this.deflaterGraphics.fillRect(halfW - 1, -halfH, 1, 16);

    // 4. Đế kim loại chịu lực ở đáy
    this.deflaterGraphics.fillStyle(0x334155, 1);
    this.deflaterGraphics.fillRect(-halfW + 1, halfH - 3, 14, 2);

    // 5. Thân trung tâm van xả khí áp suất
    this.deflaterGraphics.fillStyle(0x0284c7, 1);
    this.deflaterGraphics.fillRoundedRect(-halfW + 2, -halfH + 2, 12, 10, 1);

    // 6. Biểu tượng mũi tên xì xẹp hướng xuống màu trắng cyan
    this.deflaterGraphics.fillStyle(0xf0f9ff, 1);
    // Vạch đứng
    this.deflaterGraphics.fillRect(-1.5, -5, 3, 5);
    // Chóp nhọn hướng xuống
    this.deflaterGraphics.fillTriangle(0, 4, -3.5, -1, 3.5, -1);
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và AABB của ô xì xẹp (có dung sai khi đứng trên bệ)
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    const halfW = PHYSICS_CONFIG.DEFLATER_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.DEFLATER_HEIGHT / 2;

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
   * Hiệu ứng nén nhả khi kích hoạt xì xẹp
   */
  public triggerEffect(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.scene.tweens.add({
      targets: this,
      scaleX: 0.85,
      scaleY: 1.2,
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
