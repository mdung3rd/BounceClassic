// src/scenes/HelpScene.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Màn hình hướng dẫn điều khiển (HelpScene)
 * Hiển thị một lần duy nhất khi mở game (trước level 1).
 * Bấm phím bất kỳ hoặc click chuột để bắt đầu chơi.
 */
export class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HelpScene' });
  }

  public create(): void {
    const width = PHYSICS_CONFIG.LOGIC_WIDTH;
    const height = PHYSICS_CONFIG.LOGIC_HEIGHT;

    // 1. Nền tối retro với lưới mờ
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x1e293b, 0.6);
    for (let x = 0; x <= width; x += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(0, y, width, y);
    }

    // 2. Khung viền bảng hướng dẫn trung tâm
    const card = this.add.graphics();
    card.fillStyle(0x131d31, 0.95);
    card.fillRoundedRect(30, 18, 420, 284, 8);
    card.lineStyle(2, 0x38bdf8, 0.9);
    card.strokeRoundedRect(30, 18, 420, 284, 8);

    // 3. Tiêu đề game: BOUNCE CLASSIC
    const title = this.add.text(
      width / 2,
      44,
      'BOUNCE CLASSIC',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ef4444',
      }
    );
    title.setOrigin(0.5);

    // Icon bóng đỏ retro trang trí 2 bên tiêu đề
    const decoBallLeft = this.add.graphics();
    decoBallLeft.fillStyle(0xee2222, 1);
    decoBallLeft.fillCircle(115, 44, 7);
    decoBallLeft.fillStyle(0xff9999, 0.9);
    decoBallLeft.fillCircle(113, 42, 2);

    const decoBallRight = this.add.graphics();
    decoBallRight.fillStyle(0xee2222, 1);
    decoBallRight.fillCircle(365, 44, 7);
    decoBallRight.fillStyle(0xff9999, 0.9);
    decoBallRight.fillCircle(363, 42, 2);

    // 4. Dòng mục tiêu: "Thu hết ring để mở cổng thoát"
    const goalBox = this.add.graphics();
    goalBox.fillStyle(0x1e293b, 0.9);
    goalBox.fillRoundedRect(50, 68, 380, 24, 4);
    goalBox.lineStyle(1, 0xeab308, 0.8);
    goalBox.strokeRoundedRect(50, 68, 380, 24, 4);

    const goalText = this.add.text(
      width / 2,
      80,
      'MỤC TIÊU: Thu hết ring để mở cổng thoát',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#facc15',
      }
    );
    goalText.setOrigin(0.5);

    // 5. Đường kẻ phân cách
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x334155, 0.8);
    divider.lineBetween(50, 102, 430, 102);

    // 6. Bảng danh sách điều khiển
    this.add.text(55, 112, 'ĐIỀU KHIỂN:', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8',
    });

    const controls = [
      { action: 'Trái / Phải', keys: 'Mũi tên [←] [→]  hoặc  [A] / [D]' },
      { action: 'Nhảy',        keys: 'Phím [SPACE],  [W]  hoặc  [↑]' },
      { action: 'Tạm dừng',    keys: 'Phím [P]  hoặc  [ESC]' },
      { action: 'Chơi lại',    keys: 'Phím [R]' },
      { action: 'Về Menu',     keys: 'Phím [M]' },
    ];

    let rowY = 130;
    for (const item of controls) {
      // Nhãn hành động
      this.add.text(65, rowY, item.action, {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f8fafc',
      });

      this.add.text(160, rowY, ':', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#64748b',
      });

      // Phím tương ứng
      this.add.text(175, rowY, item.keys, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#cbd5e1',
      });

      rowY += 22;
    }

    // 7. Gợi ý bắt đầu nhấp nháy
    const startPrompt = this.add.text(
      width / 2,
      262,
      '[ BẤM PHÍM BẤT KỲ ĐỂ TIẾP TỤC ]',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#4ade80',
      }
    );
    startPrompt.setOrigin(0.5);

    this.tweens.add({
      targets: startPrompt,
      alpha: 0.25,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 8. Chuyển sang MenuScene khi bấm phím bất kỳ hoặc click / chạm chuột
    let hasStarted = false;
    const startGame = () => {
      if (hasStarted) return;
      hasStarted = true;
      this.scene.start('MenuScene');
    };

    if (this.input.keyboard) {
      this.input.keyboard.once('keydown', startGame);
    }
    this.input.once('pointerdown', startGame);
  }
}
