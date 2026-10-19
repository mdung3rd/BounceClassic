// src/objects/HUD.ts
import Phaser from 'phaser';

import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Class HUD đại diện cho thanh trạng thái hiển thị cố định trên màn hình ngang (480x320)
 * Gồm: Số mạng còn lại (Lives), Số Ring còn lại, và Điểm số (Score).
 */
export class HUD extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private livesText: Phaser.GameObjects.Text;
  private ringsText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Cố định không cuộn theo camera
    this.setScrollFactor(0);
    this.setDepth(150);

    const hudWidth = PHYSICS_CONFIG.LOGIC_WIDTH - 8;

    // 1. Nền thanh HUD bo góc phong cách Nokia retro
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillStyle(0x0f172a, 0.85);
    this.bgGraphics.fillRoundedRect(4, 3, hudWidth, 16, 3);
    this.bgGraphics.lineStyle(1, 0x334155, 0.9);
    this.bgGraphics.strokeRoundedRect(4, 3, hudWidth, 16, 3);

    // Vẽ icon quả bóng nhỏ cạnh chữ mạng (bên trái)
    this.bgGraphics.fillStyle(0xee2222, 1);
    this.bgGraphics.fillCircle(14, 11, 3.5);
    this.bgGraphics.fillStyle(0xff9999, 1);
    this.bgGraphics.fillCircle(13, 10, 1);

    // 2. Text hiển thị số mạng (bắt đầu là 3)
    this.livesText = scene.add.text(21, 5, 'x3', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f8fafc',
    });

    // Vẽ icon vòng vàng nhỏ cạnh chữ rings (ở giữa màn hình)
    const ringCenterX = Math.floor(PHYSICS_CONFIG.LOGIC_WIDTH / 2) - 18;
    this.bgGraphics.lineStyle(1.5, 0xfacc15, 1);
    this.bgGraphics.strokeEllipse(ringCenterX, 11, 6, 8);

    this.add(this.bgGraphics);
    this.add(this.livesText);

    // 3. Text hiển thị số ring còn lại
    this.ringsText = scene.add.text(ringCenterX + 8, 5, 'x0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#facc15',
    });
    this.add(this.ringsText);

    // 4. Text hiển thị điểm số (căn lề phải)
    const scoreX = PHYSICS_CONFIG.LOGIC_WIDTH - 82;
    this.scoreText = scene.add.text(scoreX, 5, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#38bdf8',
    });
    this.add(this.scoreText);

    scene.add.existing(this);
  }

  /**
   * Cập nhật số liệu hiển thị trên HUD
   *
   * @param lives Số mạng còn lại
   * @param remainingRings Số ring còn cần thu thập
   * @param score Điểm số hiện tại
   */
  public updateStats(lives: number, remainingRings: number, score: number): void {
    this.livesText.setText(`x${lives}`);
    this.ringsText.setText(`x${remainingRings}`);
    this.scoreText.setText(`SCORE: ${score}`);
  }
}
