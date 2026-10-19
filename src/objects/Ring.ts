// src/objects/Ring.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class Ring đại diện cho vòng vàng (Ring) trong Nokia Bounce.
 * Quả bóng chạm vào thì thu thập, biến mất và cộng điểm.
 */
export class Ring extends Phaser.GameObjects.Container {
  public isCollected: boolean = false;
  private ringGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.ringGraphics = scene.add.graphics();
    this.drawRing();
    this.add(this.ringGraphics);

    scene.add.existing(this);
    this.setDepth(5);
  }

  /**
   * Vẽ vòng vàng hình elip đứng chuẩn retro Nokia Bounce bằng Graphics
   */
  private drawRing(): void {
    this.ringGraphics.clear();

    const w = PHYSICS_CONFIG.RING_WIDTH;
    const h = PHYSICS_CONFIG.RING_HEIGHT;

    // Viền bóng ngoài màu cam sẫm
    this.ringGraphics.lineStyle(3, 0xd97706, 1);
    this.ringGraphics.strokeEllipse(0, 0, w, h);

    // Thân vòng màu vàng kim rực rỡ
    this.ringGraphics.lineStyle(2, 0xfacc15, 1);
    this.ringGraphics.strokeEllipse(0, 0, w, h);

    // Điểm nhấn sáng phản quang (highlight) ở góc trên bên trái
    this.ringGraphics.lineStyle(1.5, 0xfef08a, 1);
    this.ringGraphics.strokeEllipse(-1, -1, w * 0.7, h * 0.7);
  }

  /**
   * Kiểm tra va chạm giữa quả bóng (hình tròn) và Ring (AABB bao quanh elip)
   * Không dùng Arcade Physics hay Matter theo quy tắc AGENTS.md
   *
   * @param bx Tọa độ tâm X của bóng
   * @param by Tọa độ tâm Y của bóng
   * @param br Bán kính của bóng
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    if (this.isCollected) return false;

    const halfW = PHYSICS_CONFIG.RING_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.RING_HEIGHT / 2;

    const minX = this.x - halfW;
    const maxX = this.x + halfW;
    const minY = this.y - halfH;
    const maxY = this.y + halfH;

    // Tìm điểm gần nhất trên AABB của Ring tới tâm bóng
    const closestX = Math.max(minX, Math.min(bx, maxX));
    const closestY = Math.max(minY, Math.min(by, maxY));

    // Tính khoảng cách bình phương
    const dx = bx - closestX;
    const dy = by - closestY;
    return dx * dx + dy * dy <= br * br;
  }

  /**
   * Hiệu ứng khi bóng thu thập Ring: bay nhẹ lên, phóng to rồi biến mất
   */
  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.4,
      scaleY: 1.4,
      y: this.y - 8,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  /**
   * Reset trạng thái ring khi chơi lại level
   */
  public reset(): void {
    this.isCollected = false;
    this.setScale(1);
    this.setAlpha(1);
    this.setVisible(true);
  }
}
