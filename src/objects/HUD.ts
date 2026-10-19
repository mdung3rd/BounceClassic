// src/objects/HUD.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { AudioManager } from '../audio/AudioManager';

/**
 * Class HUD đại diện cho thanh trạng thái hiển thị cố định trên màn hình ngang (480x320)
 * Gồm: Số mạng còn lại (Lives), Số Ring còn lại, Điểm số (Score) và Icon loa báo trạng thái Mute.
 */
export class HUD extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private livesText: Phaser.GameObjects.Text;
  private ringsText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private speakerGraphics: Phaser.GameObjects.Graphics;
  private speakerContainer: Phaser.GameObjects.Container;
  private unsubscribeMute?: () => void;

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

    // 2. Text hiển thị số mạng (bắt đầu theo PHYSICS_CONFIG.INITIAL_LIVES)
    this.livesText = scene.add.text(21, 5, `x${PHYSICS_CONFIG.INITIAL_LIVES}`, {
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

    // 4. Text hiển thị điểm số (căn sang phải, chừa chỗ cho icon loa)
    const scoreX = PHYSICS_CONFIG.LOGIC_WIDTH - 104;
    this.scoreText = scene.add.text(scoreX, 5, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#38bdf8',
    });
    this.add(this.scoreText);

    // 5. Icon loa nhỏ báo trạng thái mute ở góc phải (x: 463, y: 11)
    const speakerX = PHYSICS_CONFIG.LOGIC_WIDTH - 17;
    const speakerY = 11;
    this.speakerContainer = scene.add.container(speakerX, speakerY);
    this.speakerGraphics = scene.add.graphics();
    this.speakerContainer.add(this.speakerGraphics);

    // Vùng bấm tương tác bằng chuột/chạm để toggle mute
    const hitZone = scene.add.zone(0, 0, 18, 14);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      AudioManager.getInstance().toggleMute();
    });
    this.speakerContainer.add(hitZone);
    this.add(this.speakerContainer);

    // Cập nhật trạng thái loa ban đầu
    const audioManager = AudioManager.getInstance();
    this.updateMuteState(audioManager.getMuted());

    // Đăng ký nhận sự kiện khi trạng thái mute thay đổi (từ phím N hoặc click)
    this.unsubscribeMute = audioManager.onMuteChange((isMuted) => {
      this.updateMuteState(isMuted);
    });

    // Hủy đăng ký khi HUD bị destroy
    this.on('destroy', () => {
      if (this.unsubscribeMute) {
        this.unsubscribeMute();
      }
    });

    scene.add.existing(this);
  }

  /**
   * Cập nhật hình vẽ icon loa theo trạng thái mute
   */
  public updateMuteState(isMuted: boolean): void {
    this.speakerGraphics.clear();

    if (!isMuted) {
      // -------------------------------------------------------------
      // TRẠNG THÁI BẬT TIẾNG (UNMUTED): Loa xanh lá + sóng âm
      // -------------------------------------------------------------
      // Thân củ loa
      this.speakerGraphics.fillStyle(0x4ade80, 1);
      this.speakerGraphics.fillRect(-5, -2.5, 3, 5);

      // Phễu loa
      this.speakerGraphics.fillTriangle(-2, -2.5, 2, -5, 2, 5);
      this.speakerGraphics.fillRect(-2, -2.5, 1, 5);

      // Sóng âm thanh nhỏ
      this.speakerGraphics.lineStyle(1.2, 0x4ade80, 0.9);
      this.speakerGraphics.beginPath();
      this.speakerGraphics.arc(2, 0, 3.5, -Phaser.Math.DEG_TO_RAD * 45, Phaser.Math.DEG_TO_RAD * 45, false);
      this.speakerGraphics.strokePath();

      // Sóng âm thanh lớn
      this.speakerGraphics.beginPath();
      this.speakerGraphics.arc(2, 0, 5.5, -Phaser.Math.DEG_TO_RAD * 45, Phaser.Math.DEG_TO_RAD * 45, false);
      this.speakerGraphics.strokePath();
    } else {
      // -------------------------------------------------------------
      // TRẠNG THÁI TẮT TIẾNG (MUTED): Loa xám + gạch chéo đỏ
      // -------------------------------------------------------------
      // Thân củ loa màu xám
      this.speakerGraphics.fillStyle(0x64748b, 0.85);
      this.speakerGraphics.fillRect(-5, -2.5, 3, 5);

      // Phễu loa màu xám
      this.speakerGraphics.fillTriangle(-2, -2.5, 2, -5, 2, 5);
      this.speakerGraphics.fillRect(-2, -2.5, 1, 5);

      // Vạch chéo đỏ báo tắt tiếng
      this.speakerGraphics.lineStyle(1.5, 0xef4444, 1);
      this.speakerGraphics.lineBetween(-5, -5, 4, 5);
    }
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
