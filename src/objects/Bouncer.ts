// src/objects/Bouncer.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { Ball } from './Ball';

/**
 * Class Bouncer đại diện cho thanh nảy ('^') trong Bounce.
 * Khi bóng chạm từ trên xuống, thanh nảy nén lại rồi phóng bóng lên rất cao.
 */
export class Bouncer extends Phaser.GameObjects.Container {
  private bouncerGraphics: Phaser.GameObjects.Graphics;
  private isBouncing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.bouncerGraphics = scene.add.graphics();
    this.drawBouncer();
    this.add(this.bouncerGraphics);

    scene.add.existing(this);
    this.setDepth(4);
  }

  /**
   * Vẽ thanh nảy retro:
   * Đế kim loại, lò xo co giãn và bàn đạp nảy màu vàng/đỏ có dấu '^'
   */
  private drawBouncer(): void {
    this.bouncerGraphics.clear();

    const halfW = PHYSICS_CONFIG.SPRING_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.SPRING_HEIGHT / 2;

    // 1. Đế kim loại cố định sát sàn
    this.bouncerGraphics.fillStyle(0x334155, 1);
    this.bouncerGraphics.fillRect(-halfW, halfH - 2, PHYSICS_CONFIG.SPRING_WIDTH, 2);

    // 2. Lò xo ở giữa
    this.bouncerGraphics.lineStyle(1.5, 0x94a3b8, 1);
    this.bouncerGraphics.lineBetween(-3, halfH - 2, 3, halfH - 3);
    this.bouncerGraphics.lineBetween(3, halfH - 3, -3, halfH - 4);
    this.bouncerGraphics.lineBetween(-3, halfH - 4, 3, halfH - 5);
    this.bouncerGraphics.lineBetween(3, halfH - 5, 0, -halfH + 2);

    // 3. Bàn đạp nảy (top plate) màu đỏ cam nổi bật
    this.bouncerGraphics.fillStyle(0xd97706, 1);
    this.bouncerGraphics.fillRoundedRect(-halfW, -halfH, PHYSICS_CONFIG.SPRING_WIDTH, 3, 1);

    // 4. Mũi tên hướng lên '^' màu vàng sáng báo hiệu lực đẩy lên
    this.bouncerGraphics.lineStyle(1.5, 0xfef08a, 1);
    this.bouncerGraphics.lineBetween(-3, -halfH + 2, 0, -halfH);
    this.bouncerGraphics.lineBetween(0, -halfH, 3, -halfH + 2);
  }

  /**
   * Kiểm tra xem bóng có đang rơi trúng thanh nảy từ trên xuống hay không
   */
  public checkCollision(ball: Ball): boolean {
    if (this.isBouncing || ball.isDead) return false;

    // Bóng phải đang rơi xuống (vy >= 0)
    if (ball.vy < 0) return false;

    const halfW = PHYSICS_CONFIG.SPRING_WIDTH / 2;
    const topPadY = this.y - PHYSICS_CONFIG.SPRING_HEIGHT / 2;

    // Đáy bóng chạm hoặc lún nhẹ vào mặt bàn đạp nảy
    const ballBottom = ball.y + ball.radius;
    const isAbovePad = ballBottom >= topPadY - 2 && ball.y <= topPadY + 6;
    const isWithinX = Math.abs(ball.x - this.x) <= halfW + ball.radius * 0.7;

    return isAbovePad && isWithinX;
  }

  /**
   * Kích hoạt phóng bóng lên cao
   */
  public trigger(ball: Ball): void {
    if (this.isBouncing) return;
    this.isBouncing = true;

    // Chọn vận tốc bắn tương ứng với dạng bóng hiện tại
    const bounceVelocity =
      ball.form === 'big'
        ? PHYSICS_CONFIG.SPRING_BOUNCE_VELOCITY_BIG
        : PHYSICS_CONFIG.SPRING_BOUNCE_VELOCITY_SMALL;

    // Đưa bóng nằm chuẩn xác trên mặt bàn đạp và bắn lên cao
    ball.y = this.y - PHYSICS_CONFIG.SPRING_HEIGHT / 2 - ball.radius;
    ball.bounce(bounceVelocity);

    // Hiệu ứng lò xo nén xuống cực nhanh rồi bung mạnh lên
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.35,
      y: this.y + 3,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.setScale(1);
        this.y = this.y;
        this.isBouncing = false;
      },
    });
  }
}
