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

    // 1. Đế kim loại xám sẫm
    this.deflaterGraphics.fillStyle(0x334155, 1);
    this.deflaterGraphics.fillRect(-halfW, halfH - 3, PHYSICS_CONFIG.DEFLATER_WIDTH, 3);

    // 2. Thân van xả màu xanh ngọc / xanh dương
    this.deflaterGraphics.fillStyle(0x0284c7, 1);
    this.deflaterGraphics.fillRoundedRect(-halfW + 1, -halfH + 2, PHYSICS_CONFIG.DEFLATER_WIDTH - 2, PHYSICS_CONFIG.DEFLATER_HEIGHT - 5, 2);

    // 3. Viền phản quang
    this.deflaterGraphics.lineStyle(1, 0x7dd3fc, 1);
    this.deflaterGraphics.strokeRoundedRect(-halfW + 1, -halfH + 2, PHYSICS_CONFIG.DEFLATER_WIDTH - 2, PHYSICS_CONFIG.DEFLATER_HEIGHT - 5, 2);

    // 4. Biểu tượng mũi tên hướng xuống / chữ 'D' màu trắng xanh
    this.deflaterGraphics.fillStyle(0xf0f9ff, 1);
    // Vạch đứng
    this.deflaterGraphics.fillRect(-1.5, -halfH + 4, 3, 7);
    // Chóp nhọn hướng xuống
    this.deflaterGraphics.fillTriangle(0, 3, -3, 0, 3, 0);
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và AABB của ô xì xẹp
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
    return dx * dx + dy * dy <= br * br;
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
