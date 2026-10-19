// src/objects/ExitGate.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class ExitGate đại diện cho cổng thoát ('E').
 * Cổng đóng (màu xám) cho đến khi người chơi ăn đủ số ring.
 * Khi thu thập đủ ring, cổng mở (màu sáng phát quang). Chạm vào cổng mở sẽ thắng màn chơi.
 */
export class ExitGate extends Phaser.GameObjects.Container {
  public isOpen: boolean = false;
  private gateGraphics: Phaser.GameObjects.Graphics;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.gateGraphics = scene.add.graphics();
    this.drawGate();
    this.add(this.gateGraphics);

    scene.add.existing(this);
    this.setDepth(2);
  }

  /**
   * Vẽ cổng vòm phong cách retro Nokia Bounce
   */
  private drawGate(): void {
    this.gateGraphics.clear();

    const w = PHYSICS_CONFIG.EXIT_GATE_WIDTH;
    const h = PHYSICS_CONFIG.EXIT_GATE_HEIGHT;
    const halfW = w / 2;
    const halfH = h / 2;

    if (!this.isOpen) {
      // -----------------------------------------------------------
      // TRẠNG THÁI ĐÓNG: Vòm đá xám, cửa sắt chốt chặt
      // -----------------------------------------------------------
      // Lòng cổng tối màu
      this.gateGraphics.fillStyle(0x1e293b, 1);
      this.gateGraphics.fillRect(-halfW + 2, -halfH + 4, w - 4, h - 4);

      // Nan sắt cửa đóng
      this.gateGraphics.fillStyle(0x475569, 1);
      for (let ox = -halfW + 4; ox < halfW - 2; ox += 3) {
        this.gateGraphics.fillRect(ox, -halfH + 4, 1.5, h - 4);
      }

      // Khung vòm đá ngoài màu xám đậm
      this.gateGraphics.lineStyle(2, 0x64748b, 1);
      this.gateGraphics.strokeRect(-halfW, -halfH, w, h);

      // Đỉnh vòm cong
      this.gateGraphics.fillStyle(0x64748b, 1);
      this.gateGraphics.fillRect(-halfW - 1, -halfH - 1, w + 2, 3);
    } else {
      // -----------------------------------------------------------
      // TRẠNG THÁI MỞ: Cổng vòm phát quang năng lượng cyan/vàng
      // -----------------------------------------------------------
      // Lòng cổng xoáy sáng năng lượng màu cyan
      this.gateGraphics.fillStyle(0x06b6d4, 1);
      this.gateGraphics.fillRect(-halfW + 1, -halfH + 2, w - 2, h - 2);

      // Vùng tâm sáng trắng
      this.gateGraphics.fillStyle(0xe0f2fe, 1);
      this.gateGraphics.fillEllipse(0, 0, w * 0.5, h * 0.6);

      // Tâm lõi cổng màu trắng tinh
      this.gateGraphics.fillStyle(0xffffff, 1);
      this.gateGraphics.fillCircle(0, 0, 3);

      // Khung vòm viền vàng kim rực rỡ
      this.gateGraphics.lineStyle(2, 0xfacc15, 1);
      this.gateGraphics.strokeRect(-halfW, -halfH, w, h);

      // Đỉnh vòm vàng
      this.gateGraphics.fillStyle(0xfef08a, 1);
      this.gateGraphics.fillRect(-halfW - 1, -halfH - 2, w + 2, 3);
    }
  }

  /**
   * Mở cổng thoát khi đã thu thập toàn bộ Ring
   */
  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.drawGate();

    // Hiệu ứng nhịp đập phát sáng mời gọi người chơi
    this.glowTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Kiểm tra va chạm giữa bóng tròn và cổng đang mở
   */
  public checkCollision(bx: number, by: number, br: number): boolean {
    if (!this.isOpen) return false;

    const halfW = PHYSICS_CONFIG.EXIT_GATE_WIDTH / 2;
    const halfH = PHYSICS_CONFIG.EXIT_GATE_HEIGHT / 2;

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
   * Đặt lại trạng thái đóng cổng
   */
  public reset(): void {
    this.isOpen = false;
    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = undefined;
    }
    this.setScale(1);
    this.drawGate();
  }
}
