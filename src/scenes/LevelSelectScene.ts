// src/scenes/LevelSelectScene.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { isLevelUnlocked, getHighScore } from '../utils/save';
import { LEVELS } from '../levels';

interface LevelSlot {
  index: number;
  levelNumber: number;
  isAvailable: boolean;
  isUnlocked: boolean;
  highScore: number;
  col: number;
  row: number;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  bgBox: Phaser.GameObjects.Graphics;
  numberText: Phaser.GameObjects.Text;
  scoreText?: Phaser.GameObjects.Text;
  lockIcon?: Phaser.GameObjects.Graphics;
}

/**
 * Màn hình chọn màn chơi (LevelSelectScene)
 * Hiển thị lưới các ô level (số thứ tự, icon ổ khoá, điểm cao).
 * Điều hướng bằng mũi tên (hoặc WASD), Enter để vào, Esc để về menu.
 */
export class LevelSelectScene extends Phaser.Scene {
  private static readonly COLS = 4;
  private static readonly ROWS = 2;
  private static readonly TOTAL_SLOTS = 8;

  private selectedIndex: number = 0;
  private slots: LevelSlot[] = [];

  // Khung viền viền sáng bao quanh ô đang chọn
  private highlightBox!: Phaser.GameObjects.Graphics;

  // Khu vực thông tin chi tiết level phía dưới
  private detailTitleText!: Phaser.GameObjects.Text;
  private detailStatusText!: Phaser.GameObjects.Text;
  private detailActionText!: Phaser.GameObjects.Text;

  // Phím điều hướng
  private keyLeft?: Phaser.Input.Keyboard.Key;
  private keyRight?: Phaser.Input.Keyboard.Key;
  private keyUp?: Phaser.Input.Keyboard.Key;
  private keyDown?: Phaser.Input.Keyboard.Key;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyEnter?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  public create(): void {
    const width = PHYSICS_CONFIG.LOGIC_WIDTH;
    const height = PHYSICS_CONFIG.LOGIC_HEIGHT;

    // 1. Nền tối retro với lưới mờ
    this.createBackground(width, height);

    // 2. Tiêu đề màn hình
    this.createHeader(width);

    // 3. Khởi tạo lưới 8 ô level (2 hàng x 4 cột)
    this.createLevelGrid(width);

    // 4. Khung viền sáng highlight ô đang chọn
    this.createHighlightBox();

    // 5. Khu vực hiển thị thông tin chi tiết level phía dưới
    this.createDetailPanel(width);

    // 6. Gợi ý điều khiển dưới chân màn hình
    this.createFooter(width, height);

    // 7. Thiết lập phím điều khiển
    this.setupControls();

    // 8. Cập nhật trạng thái hiển thị theo ô đang chọn ban đầu
    this.updateSelection();
  }

  /**
   * Tạo nền retro pixel với các đường kẻ lưới mờ
   */
  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0f1d, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x1e293b, 0.5);
    for (let x = 0; x <= width; x += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += PHYSICS_CONFIG.TILE_SIZE) {
      bg.lineBetween(0, y, width, y);
    }
  }

  /**
   * Vẽ tiêu đề "SELECT LEVEL" và nút bấm Esc quay lại
   */
  private createHeader(width: number): void {
    const title = this.add.text(width / 2, 28, 'SELECT LEVEL', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#facc15',
    });
    title.setOrigin(0.5);

    const backHint = this.add.text(28, 28, '[ESC] MENU', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });
    backHint.setOrigin(0, 0.5);
    backHint.setInteractive({ useHandCursor: true });
    backHint.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x334155, 0.8);
    divider.lineBetween(28, 46, width - 28, 46);
  }

  /**
   * Tạo lưới các ô level
   */
  private createLevelGrid(width: number): void {
    this.slots = [];

    const slotWidth = 76;
    const slotHeight = 62;
    const gapX = 14;
    const gapY = 12;

    const totalGridWidth =
      LevelSelectScene.COLS * slotWidth + (LevelSelectScene.COLS - 1) * gapX;
    const startX = (width - totalGridWidth) / 2 + slotWidth / 2;
    const startY = 88;

    for (let i = 0; i < LevelSelectScene.TOTAL_SLOTS; i++) {
      const col = i % LevelSelectScene.COLS;
      const row = Math.floor(i / LevelSelectScene.COLS);

      const x = startX + col * (slotWidth + gapX);
      const y = startY + row * (slotHeight + gapY);

      const isAvailable = i < LEVELS.length;
      const isUnlocked = isAvailable && isLevelUnlocked(i);
      const highScore = isUnlocked ? getHighScore(i) : 0;

      const container = this.add.container(x, y);

      // Nền ô level
      const bgBox = this.add.graphics();
      bgBox.setInteractive(
        new Phaser.Geom.Rectangle(-slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight),
        Phaser.Geom.Rectangle.Contains
      );

      // Số thứ tự màn chơi
      const numberText = this.add.text(0, isUnlocked ? -12 : -14, `${i + 1}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: isUnlocked ? '#f8fafc' : '#64748b',
      });
      numberText.setOrigin(0.5);
      container.add([bgBox, numberText]);

      let scoreText: Phaser.GameObjects.Text | undefined;
      let lockIcon: Phaser.GameObjects.Graphics | undefined;

      if (isUnlocked) {
        // Vẽ trạng thái ô đã mở khoá
        bgBox.fillStyle(0x1e293b, 0.95);
        bgBox.fillRoundedRect(-slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight, 6);
        bgBox.lineStyle(1.5, 0x38bdf8, 0.8);
        bgBox.strokeRoundedRect(-slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight, 6);

        // Hiển thị điểm cao
        scoreText = this.add.text(0, 14, highScore > 0 ? `★ ${highScore}` : 'BEST: 0', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: highScore > 0 ? '#4ade80' : '#94a3b8',
        });
        scoreText.setOrigin(0.5);
        container.add(scoreText);
      } else {
        // Vẽ trạng thái ô bị khoá (màu xám + icon ổ khoá pixel)
        bgBox.fillStyle(0x0f172a, 0.85);
        bgBox.fillRoundedRect(-slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight, 6);
        bgBox.lineStyle(1, 0x334155, 0.6);
        bgBox.strokeRoundedRect(-slotWidth / 2, -slotHeight / 2, slotWidth, slotHeight, 6);

        // Vẽ icon ổ khoá pixel
        lockIcon = this.drawLockIcon(0, 13);
        container.add(lockIcon);
      }

      // Xử lý click chuột vào ô
      const slotIndex = i;
      bgBox.on('pointerover', () => {
        this.selectedIndex = slotIndex;
        this.updateSelection();
      });

      bgBox.on('pointerdown', () => {
        if (this.selectedIndex === slotIndex) {
          this.confirmSelection();
        } else {
          this.selectedIndex = slotIndex;
          this.updateSelection();
        }
      });

      this.slots.push({
        index: i,
        levelNumber: i + 1,
        isAvailable,
        isUnlocked,
        highScore,
        col,
        row,
        x,
        y,
        container,
        bgBox,
        numberText,
        scoreText,
        lockIcon,
      });
    }
  }

  /**
   * Vẽ icon ổ khoá pixel bằng Graphics
   */
  private drawLockIcon(offsetX: number, offsetY: number): Phaser.GameObjects.Graphics {
    const lock = this.add.graphics();

    // Vòng quai khoá
    lock.lineStyle(1.5, 0x94a3b8, 1);
    lock.strokeCircle(offsetX, offsetY - 4, 4);

    // Thân ổ khoá màu xám kim loại
    lock.fillStyle(0x64748b, 1);
    lock.fillRoundedRect(offsetX - 6, offsetY - 2, 12, 10, 2);
    lock.lineStyle(1, 0x94a3b8, 0.8);
    lock.strokeRoundedRect(offsetX - 6, offsetY - 2, 12, 10, 2);

    // Lỗ khoá ở giữa
    lock.fillStyle(0x0f172a, 1);
    lock.fillCircle(offsetX, offsetY + 2, 1.5);
    lock.fillRect(offsetX - 0.75, offsetY + 2, 1.5, 3);

    return lock;
  }

  /**
   * Khởi tạo khung viền sáng nhấp nháy cho ô đang được chọn
   */
  private createHighlightBox(): void {
    this.highlightBox = this.add.graphics();
    this.highlightBox.setDepth(15);

    // Tween nhấp nháy nhẹ cho viền chọn
    this.tweens.add({
      targets: this.highlightBox,
      alpha: 0.6,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Tạo bảng thông tin chi tiết về level đang được chọn
   */
  private createDetailPanel(width: number): void {
    const panelY = 224;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x131d31, 0.9);
    panelBg.fillRoundedRect(width / 2 - 180, panelY, 360, 48, 6);
    panelBg.lineStyle(1, 0x334155, 0.8);
    panelBg.strokeRoundedRect(width / 2 - 180, panelY, 360, 48, 6);

    this.detailTitleText = this.add.text(width / 2 - 165, panelY + 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#facc15',
    });

    this.detailStatusText = this.add.text(width / 2 + 165, panelY + 10, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#4ade80',
    });
    this.detailStatusText.setOrigin(1, 0);

    this.detailActionText = this.add.text(width / 2, panelY + 30, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#38bdf8',
    });
    this.detailActionText.setOrigin(0.5);
  }

  /**
   * Gợi ý phím điều khiển ở chân màn hình
   */
  private createFooter(width: number, height: number): void {
    const footerText = this.add.text(
      width / 2,
      height - 20,
      '[MŨI TÊN / WASD]: Di chuyển  |  [ENTER]: Chọn  |  [ESC]: Quay lại',
      {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#64748b',
      }
    );
    footerText.setOrigin(0.5);
  }

  /**
   * Đăng ký phím điều hướng và phím hành động
   */
  private setupControls(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.resetKeys();
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  /**
   * Cập nhật vị trí khung viền highlight và nội dung bảng thông tin
   */
  private updateSelection(): void {
    const selectedSlot = this.slots[this.selectedIndex];
    if (!selectedSlot) return;

    const slotWidth = 76;
    const slotHeight = 62;

    // Vẽ viền highlight bao quanh ô đang chọn
    this.highlightBox.clear();
    this.highlightBox.lineStyle(2.5, 0xfacc15, 1);
    this.highlightBox.strokeRoundedRect(
      selectedSlot.x - slotWidth / 2 - 2,
      selectedSlot.y - slotHeight / 2 - 2,
      slotWidth + 4,
      slotHeight + 4,
      8
    );

    // Cập nhật thông tin chi tiết
    if (selectedSlot.isUnlocked) {
      this.detailTitleText.setText(`LEVEL ${selectedSlot.levelNumber}`);
      this.detailTitleText.setColor('#facc15');

      const scoreStr =
        selectedSlot.highScore > 0 ? `KỶ LỤC: ${selectedSlot.highScore} ĐIỂM` : 'CHƯA CÓ KỶ LỤC';
      this.detailStatusText.setText(scoreStr);
      this.detailStatusText.setColor('#4ade80');

      this.detailActionText.setText('[ENTER / SPACE]: BẮT ĐẦU CHƠI');
      this.detailActionText.setColor('#38bdf8');
    } else {
      this.detailTitleText.setText(`LEVEL ${selectedSlot.levelNumber}`);
      this.detailTitleText.setColor('#94a3b8');

      if (!selectedSlot.isAvailable) {
        this.detailStatusText.setText('SẮP RA MẮT');
        this.detailStatusText.setColor('#eab308');
        this.detailActionText.setText('Màn chơi đang được phát triển');
        this.detailActionText.setColor('#64748b');
      } else {
        this.detailStatusText.setText('ĐÃ KHÓA');
        this.detailStatusText.setColor('#ef4444');
        this.detailActionText.setText(`Hoàn thành Level ${selectedSlot.levelNumber - 1} để mở khóa`);
        this.detailActionText.setColor('#94a3b8');
      }
    }
  }

  /**
   * Kích hoạt vào màn chơi nếu ô đang chọn đã mở khoá
   */
  private confirmSelection(): void {
    const selectedSlot = this.slots[this.selectedIndex];
    if (!selectedSlot) return;

    if (selectedSlot.isUnlocked) {
      this.scene.start('GameScene', { levelIndex: selectedSlot.index });
    } else {
      // Hiệu ứng cảnh báo khi chọn level bị khoá
      this.cameras.main.shake(120, 0.005);
    }
  }

  public update(): void {
    const currentSlot = this.slots[this.selectedIndex];
    if (!currentSlot) return;

    // 1. Phím Trái (LEFT / A)
    if (
      (this.keyLeft && Phaser.Input.Keyboard.JustDown(this.keyLeft)) ||
      (this.keyA && Phaser.Input.Keyboard.JustDown(this.keyA))
    ) {
      if (currentSlot.col > 0) {
        this.selectedIndex -= 1;
        this.updateSelection();
      }
    }

    // 2. Phím Phải (RIGHT / D)
    if (
      (this.keyRight && Phaser.Input.Keyboard.JustDown(this.keyRight)) ||
      (this.keyD && Phaser.Input.Keyboard.JustDown(this.keyD))
    ) {
      if (currentSlot.col < LevelSelectScene.COLS - 1 && this.selectedIndex < this.slots.length - 1) {
        this.selectedIndex += 1;
        this.updateSelection();
      }
    }

    // 3. Phím Lên (UP / W)
    if (
      (this.keyUp && Phaser.Input.Keyboard.JustDown(this.keyUp)) ||
      (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW))
    ) {
      if (currentSlot.row > 0) {
        this.selectedIndex -= LevelSelectScene.COLS;
        this.updateSelection();
      }
    }

    // 4. Phím Xuống (DOWN / S)
    if (
      (this.keyDown && Phaser.Input.Keyboard.JustDown(this.keyDown)) ||
      (this.keyS && Phaser.Input.Keyboard.JustDown(this.keyS))
    ) {
      if (
        currentSlot.row < LevelSelectScene.ROWS - 1 &&
        this.selectedIndex + LevelSelectScene.COLS < this.slots.length
      ) {
        this.selectedIndex += LevelSelectScene.COLS;
        this.updateSelection();
      }
    }

    // 5. Phím Enter hoặc Space để vào màn chơi
    if (
      (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) ||
      (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace))
    ) {
      this.confirmSelection();
    }

    // 6. Phím Esc để quay về MenuScene
    if (this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.scene.start('MenuScene');
    }
  }
}
