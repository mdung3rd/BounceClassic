// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { getHighestUnlockedLevel } from '../utils/save';
import { LEVELS } from '../levels';
import { AudioManager } from '../audio/AudioManager';

interface MenuItem {
  title: string;
  subtitle: string;
  action: () => void;
  container?: Phaser.GameObjects.Container;
  bgBox?: Phaser.GameObjects.Graphics;
  titleText?: Phaser.GameObjects.Text;
  subtitleText?: Phaser.GameObjects.Text;
}

/**
 * Menu chính của game (MenuScene)
 * Hiển thị sau HelpScene hoặc khi bấm M từ GameScene.
 * Hỗ trợ điều hướng bằng mũi tên Lên/Xuống + Enter/Space và chuột.
 */
export class MenuScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuItems: MenuItem[] = [];
  private selectorBall!: Phaser.GameObjects.Graphics;

  private keyUp?: Phaser.Input.Keyboard.Key;
  private keyDown?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyEnter?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyH?: Phaser.Input.Keyboard.Key;
  private keyN?: Phaser.Input.Keyboard.Key;

  private speakerGraphics!: Phaser.GameObjects.Graphics;
  private unsubscribeMute?: () => void;

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const width = PHYSICS_CONFIG.LOGIC_WIDTH;
    const height = PHYSICS_CONFIG.LOGIC_HEIGHT;

    // 1. Nền xanh đen retro với lưới mờ
    this.createBackground(width, height);

    // 2. Khung viền và Tiêu đề game "BOUNCE CLASSIC"
    this.createHeader(width);

    // 3. Khởi tạo danh sách Menu (PLAY và LEVELS)
    this.setupMenuItems(width);

    // 4. Biểu tượng quả bóng đỏ đóng vai trò con trỏ lựa chọn
    this.createSelectorBall();

    // 5. Gợi ý điều khiển dưới chân màn hình
    this.createFooter(width, height);

    // 5.1. Icon loa nhỏ báo trạng thái mute ở góc phải trên
    this.createSpeakerIcon(width);

    // 6. Đăng ký phím điều hướng
    this.setupControls();

    // 7. Cập nhật giao diện menu theo mục đang chọn ban đầu
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
   * Vẽ tiêu đề game và các hình bóng đỏ trang trí
   */
  private createHeader(width: number): void {
    // Khung viền tiêu đề
    const headerBox = this.add.graphics();
    headerBox.fillStyle(0x131d31, 0.9);
    headerBox.fillRoundedRect(width / 2 - 160, 24, 320, 72, 8);
    headerBox.lineStyle(2, 0xef4444, 0.9);
    headerBox.strokeRoundedRect(width / 2 - 160, 24, 320, 72, 8);

    // Chữ tiêu đề chính
    const title = this.add.text(width / 2, 50, 'BOUNCE CLASSIC', {
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ef4444',
    });
    title.setOrigin(0.5);

    // Phụ đề nhỏ phong cách Nokia
    const subtitle = this.add.text(width / 2, 74, 'NOKIA RETRO EDITION', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#94a3b8',
      letterSpacing: 2,
    });
    subtitle.setOrigin(0.5);

    // Hai quả bóng đỏ trang trí hai bên tiêu đề với hiệu ứng nhấp nhô
    const ballLeft = this.add.graphics();
    ballLeft.fillStyle(0xee2222, 1);
    ballLeft.fillCircle(width / 2 - 126, 60, 10);
    ballLeft.fillStyle(0xff9999, 0.9);
    ballLeft.fillCircle(width / 2 - 129, 57, 3);

    const ballRight = this.add.graphics();
    ballRight.fillStyle(0xee2222, 1);
    ballRight.fillCircle(width / 2 + 126, 60, 10);
    ballRight.fillStyle(0xff9999, 0.9);
    ballRight.fillCircle(width / 2 + 123, 57, 3);

    this.tweens.add({
      targets: [ballLeft, ballRight],
      y: -4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Cấu hình 2 nút: PLAY (vào level mở khóa cao nhất) và LEVELS (màn chọn level)
   */
  private setupMenuItems(width: number): void {
    const highestLevel = getHighestUnlockedLevel();
    // Giới hạn trong số lượng level thực tế đang có
    const targetLevelIndex = Math.min(highestLevel, LEVELS.length - 1);
    const targetLevelNumber = targetLevelIndex + 1;

    this.menuItems = [
      {
        title: 'PLAY',
        subtitle: `Vào Level ${targetLevelNumber} (Mở khóa cao nhất)`,
        action: () => {
          this.scene.start('GameScene', { levelIndex: targetLevelIndex });
        },
      },
      {
        title: 'LEVELS',
        subtitle: 'Chọn màn chơi & xem điểm kỷ lục',
        action: () => {
          this.scene.start('LevelSelectScene');
        },
      },
    ];

    const startY = 124;
    const buttonWidth = 260;
    const buttonHeight = 52;
    const gap = 16;

    this.menuItems.forEach((item, index) => {
      const y = startY + index * (buttonHeight + gap);
      const container = this.add.container(width / 2, y);

      const bgBox = this.add.graphics();
      bgBox.setInteractive(
        new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );

      const titleText = this.add.text(0, -9, item.title, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f8fafc',
      });
      titleText.setOrigin(0.5);

      const subtitleText = this.add.text(0, 13, item.subtitle, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#94a3b8',
      });
      subtitleText.setOrigin(0.5);

      container.add([bgBox, titleText, subtitleText]);

      // Tương tác chuột
      bgBox.on('pointerover', () => {
        if (this.selectedIndex !== index) {
          this.selectedIndex = index;
          this.updateSelection();
          AudioManager.getInstance().playMenuMove();
        }
      });

      bgBox.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
        this.confirmSelection();
      });

      item.container = container;
      item.bgBox = bgBox;
      item.titleText = titleText;
      item.subtitleText = subtitleText;
    });
  }

  /**
   * Tạo icon quả bóng đỏ chỉ vào mục menu đang active
   */
  private createSelectorBall(): void {
    this.selectorBall = this.add.graphics();
    this.selectorBall.fillStyle(0xee2222, 1);
    this.selectorBall.fillCircle(0, 0, 7);
    this.selectorBall.fillStyle(0xff9999, 0.9);
    this.selectorBall.fillCircle(-2, -2, 2);
    this.selectorBall.setDepth(10);

    // Hiệu ứng nhịp nảy cho con trỏ
    this.tweens.add({
      targets: this.selectorBall,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Gợi ý phím bấm chân màn hình
   */
  private createFooter(width: number, height: number): void {
    const hint = this.add.text(
      width / 2,
      height - 30,
      '[↑/↓]: Chọn  |  [ENTER / SPACE]: Vào  |  [N]: Âm thanh  |  [H]: Hướng dẫn',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#64748b',
      }
    );
    hint.setOrigin(0.5);

    // Nhấp nháy nhẹ gợi ý
    this.tweens.add({
      targets: hint,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Tạo icon loa nhỏ ở góc trên bên phải màn hình Menu
   */
  private createSpeakerIcon(width: number): void {
    const speakerContainer = this.add.container(width - 18, 14);
    speakerContainer.setDepth(100);

    this.speakerGraphics = this.add.graphics();
    speakerContainer.add(this.speakerGraphics);

    const hitZone = this.add.zone(0, 0, 22, 18);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      AudioManager.getInstance().toggleMute();
    });
    speakerContainer.add(hitZone);

    const audioManager = AudioManager.getInstance();
    this.updateSpeakerIcon(audioManager.getMuted());

    this.unsubscribeMute = audioManager.onMuteChange((muted) => {
      this.updateSpeakerIcon(muted);
    });

    this.events.once('shutdown', () => {
      if (this.unsubscribeMute) {
        this.unsubscribeMute();
      }
    });
  }

  /**
   * Cập nhật hình vẽ icon loa theo trạng thái mute
   */
  private updateSpeakerIcon(isMuted: boolean): void {
    this.speakerGraphics.clear();

    if (!isMuted) {
      this.speakerGraphics.fillStyle(0x4ade80, 1);
      this.speakerGraphics.fillRect(-5, -2.5, 3, 5);
      this.speakerGraphics.fillTriangle(-2, -2.5, 2, -5, 2, 5);
      this.speakerGraphics.fillRect(-2, -2.5, 1, 5);

      this.speakerGraphics.lineStyle(1.2, 0x4ade80, 0.9);
      this.speakerGraphics.beginPath();
      this.speakerGraphics.arc(2, 0, 3.5, -Phaser.Math.DEG_TO_RAD * 45, Phaser.Math.DEG_TO_RAD * 45, false);
      this.speakerGraphics.strokePath();

      this.speakerGraphics.beginPath();
      this.speakerGraphics.arc(2, 0, 5.5, -Phaser.Math.DEG_TO_RAD * 45, Phaser.Math.DEG_TO_RAD * 45, false);
      this.speakerGraphics.strokePath();
    } else {
      this.speakerGraphics.fillStyle(0x64748b, 0.85);
      this.speakerGraphics.fillRect(-5, -2.5, 3, 5);
      this.speakerGraphics.fillTriangle(-2, -2.5, 2, -5, 2, 5);
      this.speakerGraphics.fillRect(-2, -2.5, 1, 5);

      this.speakerGraphics.lineStyle(1.5, 0xef4444, 1);
      this.speakerGraphics.lineBetween(-5, -5, 4, 5);
    }
  }

  /**
   * Đăng ký phím điều hướng menu
   */
  private setupControls(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.resetKeys();
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
  }

  /**
   * Cập nhật màu sắc, viền và vị trí con trỏ khi thay đổi mục chọn
   */
  private updateSelection(): void {
    const buttonWidth = 260;
    const buttonHeight = 52;

    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;

      if (item.bgBox) {
        item.bgBox.clear();
        if (isSelected) {
          // Khung nổi bật cho mục đang chọn
          item.bgBox.fillStyle(0x1e293b, 0.95);
          item.bgBox.fillRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            6
          );
          item.bgBox.lineStyle(2, 0xfacc15, 1);
          item.bgBox.strokeRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            6
          );
        } else {
          // Khung tối cho mục không chọn
          item.bgBox.fillStyle(0x0f172a, 0.8);
          item.bgBox.fillRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            6
          );
          item.bgBox.lineStyle(1, 0x334155, 0.7);
          item.bgBox.strokeRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            6
          );
        }
      }

      if (item.titleText) {
        item.titleText.setColor(isSelected ? '#facc15' : '#e2e8f0');
      }

      if (item.subtitleText) {
        item.subtitleText.setColor(isSelected ? '#38bdf8' : '#64748b');
      }

      // Đặt vị trí quả bóng chỉ dẫn cạnh mục đang chọn
      if (isSelected && item.container) {
        this.selectorBall.setPosition(
          item.container.x - buttonWidth / 2 - 16,
          item.container.y
        );
      }
    });
  }

  /**
   * Kích hoạt hành động của mục menu đang được chọn
   */
  private confirmSelection(): void {
    const selectedItem = this.menuItems[this.selectedIndex];
    if (selectedItem) {
      AudioManager.getInstance().playMenuSelect();
      selectedItem.action();
    }
  }

  public update(): void {
    // 0. Phím N bật/tắt tiếng (Mute)
    if (this.keyN && Phaser.Input.Keyboard.JustDown(this.keyN)) {
      AudioManager.getInstance().toggleMute();
    }

    // 1. Phím Lên (UP / W)
    if (
      (this.keyUp && Phaser.Input.Keyboard.JustDown(this.keyUp)) ||
      (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW))
    ) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
      AudioManager.getInstance().playMenuMove();
    }

    // 2. Phím Xuống (DOWN / S)
    if (
      (this.keyDown && Phaser.Input.Keyboard.JustDown(this.keyDown)) ||
      (this.keyS && Phaser.Input.Keyboard.JustDown(this.keyS))
    ) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.updateSelection();
      AudioManager.getInstance().playMenuMove();
    }

    // 3. Phím Enter hoặc Space để chọn
    if (
      (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) ||
      (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace))
    ) {
      this.confirmSelection();
    }

    // 4. Phím H để xem lại màn hình hướng dẫn điều khiển
    if (this.keyH && Phaser.Input.Keyboard.JustDown(this.keyH)) {
      this.scene.start('HelpScene');
    }
  }
}
