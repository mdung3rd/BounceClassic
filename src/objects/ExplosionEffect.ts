// src/objects/ExplosionEffect.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Hiệu ứng bóng nổ khi va chạm gai:
 * Bắn các mảnh hạt tròn màu đỏ/cam/vàng tỏa đều ra các hướng và mờ dần trong 0.5s
 */
export class ExplosionEffect extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, onComplete?: () => void) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(25);

    const particleCount = 10;
    const durationMs = PHYSICS_CONFIG.EXPLOSION_DURATION * 1000;
    const colors = [0xef4444, 0xf97316, 0xfacc15, 0xffffff];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 16 + Math.random() * 16;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      const color = colors[i % colors.length];

      const p = scene.add.graphics();
      p.fillStyle(color, 1);
      p.fillCircle(0, 0, 1.8);
      this.add(p);

      scene.tweens.add({
        targets: p,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: durationMs,
        ease: 'Power2',
      });
    }

    // Tự hủy container và gọi callback sau 0.5s
    scene.time.delayedCall(durationMs, () => {
      if (onComplete) onComplete();
      this.destroy();
    });
  }
}
