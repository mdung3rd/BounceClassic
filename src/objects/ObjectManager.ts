// src/objects/ObjectManager.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { LevelData } from '../levels/types';
import { Ball } from './Ball';
import { Ring } from './Ring';
import { Spike } from './Spike';
import { Checkpoint } from './Checkpoint';
import { ExitGate } from './ExitGate';
import { ExplosionEffect } from './ExplosionEffect';
import { Pump } from './Pump';
import { Deflater } from './Deflater';
import { Bouncer } from './Bouncer';
import { Enemy } from './Enemy';
import { Water } from './Water';
import { AudioManager } from '../audio/AudioManager';

export interface ObjectManagerEvents {
  onStatsChange?: (lives: number, remainingRings: number, score: number) => void;
  onGameOver?: () => void;
  onLevelComplete?: () => void;
}

/**
 * Class ObjectManager quản lý toàn bộ các đối tượng gameplay trong level:
 * Ring, Spike, Checkpoint, ExitGate, Pump ('I'), Deflater ('D'),
 * Bouncer ('^'), Enemy ('M'), Water ('~').
 */
export class ObjectManager {
  private scene: Phaser.Scene;
  private level: LevelData;

  public rings: Ring[] = [];
  public spikes: Spike[] = [];
  public checkpoints: Checkpoint[] = [];
  public exitGate?: ExitGate;
  public pumps: Pump[] = [];
  public deflaters: Deflater[] = [];
  public bouncers: Bouncer[] = [];
  public enemies: Enemy[] = [];
  public waters: Water[] = [];

  // Điểm hồi sinh hiện tại của bóng (mặc định là điểm P xuất phát ban đầu)
  public respawnPoint: { x: number; y: number };

  // Thông số người chơi
  public lives: number = PHYSICS_CONFIG.INITIAL_LIVES;
  public score: number = 0;

  // Trạng thái kết thúc game
  public isGameOver: boolean = false;
  public isLevelComplete: boolean = false;

  private events?: ObjectManagerEvents;

  constructor(scene: Phaser.Scene, level: LevelData, events?: ObjectManagerEvents) {
    this.scene = scene;
    this.level = level;
    this.events = events;
    this.respawnPoint = { x: level.spawnX, y: level.spawnY };

    this.initFromLevel(level);
  }

  /**
   * Đọc dữ liệu level và khởi tạo toàn bộ các đối tượng tương ứng
   */
  private initFromLevel(level: LevelData): void {
    const tileSize = PHYSICS_CONFIG.TILE_SIZE;
    const halfTile = tileSize / 2;

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const char = level.grid[y][x];
        const px = x * tileSize + halfTile;
        const py = y * tileSize + halfTile;

        switch (char) {
          case 'R': {
            // Nếu Ring chìm trong hồ nước, tạo thêm ô nước nền phía sau
            const isSubmerged =
              (x > 0 && level.grid[y][x - 1] === '~') ||
              (x < level.width - 1 && level.grid[y][x + 1] === '~') ||
              (y > 0 && level.grid[y - 1][x] === '~');
            if (isSubmerged) {
              const isSurface = y === 0 || level.grid[y - 1][x] !== '~';
              const waterBg = new Water(this.scene, px, py, isSurface);
              this.waters.push(waterBg);
            }
            const ring = new Ring(this.scene, px, py);
            this.rings.push(ring);
            break;
          }
          case 'S': {
            const spike = new Spike(this.scene, px, py);
            this.spikes.push(spike);
            break;
          }
          case 'C': {
            const checkpoint = new Checkpoint(this.scene, px, py);
            this.checkpoints.push(checkpoint);
            break;
          }
          case 'E': {
            this.exitGate = new ExitGate(this.scene, px, py);
            break;
          }
          case 'I': {
            // Nếu ô Bơm chìm trong hồ nước, tạo thêm ô nước nền phía sau
            const isSubmerged =
              (x > 0 && level.grid[y][x - 1] === '~') ||
              (x < level.width - 1 && level.grid[y][x + 1] === '~') ||
              (y > 0 && level.grid[y - 1][x] === '~');
            if (isSubmerged) {
              const isSurface = y === 0 || level.grid[y - 1][x] !== '~';
              const waterBg = new Water(this.scene, px, py, isSurface);
              this.waters.push(waterBg);
            }
            const pump = new Pump(this.scene, px, py);
            this.pumps.push(pump);
            break;
          }
          case 'D': {
            const deflater = new Deflater(this.scene, px, py);
            this.deflaters.push(deflater);
            break;
          }
          case '^': {
            // Đặt thanh nảy nằm áp sát mép dưới của tile
            const bouncerY = py + (tileSize - PHYSICS_CONFIG.SPRING_HEIGHT) / 2;
            const bouncer = new Bouncer(this.scene, px, bouncerY);
            this.bouncers.push(bouncer);
            break;
          }
          case '~': {
            // Xác định xem có phải là ô mặt nước trên cùng hay không
            const isSurface = y === 0 || level.grid[y - 1][x] !== '~';
            const water = new Water(this.scene, px, py, isSurface);
            this.waters.push(water);
            break;
          }
        }
      }
    }

    // Khởi tạo các kẻ địch tuần tra
    for (const def of level.enemies) {
      const enemy = new Enemy(
        this.scene,
        def.x,
        def.y,
        def.minX,
        def.maxX,
        def.speed ?? PHYSICS_CONFIG.ENEMY_SPEED
      );
      this.enemies.push(enemy);
    }

    // Phát sự kiện cập nhật HUD ban đầu
    this.notifyStatsChange();
  }

  /**
   * Tính số ring còn lại chưa ăn
   */
  public get remainingRings(): number {
    return this.rings.filter((r) => !r.isCollected).length;
  }

  /**
   * Báo sự kiện thay đổi điểm / mạng / ring
   */
  private notifyStatsChange(): void {
    if (this.events?.onStatsChange) {
      this.events.onStatsChange(this.lives, this.remainingRings, this.score);
    }
  }

  /**
   * Cập nhật và kiểm tra va chạm giữa Ball và toàn bộ các đối tượng game
   * Được gọi mỗi frame từ GameScene
   *
   * @param ball Quả bóng người chơi
   * @param dt Thời gian trôi qua frame này (giây)
   */
  public update(ball: Ball, dt: number): void {
    if (this.isGameOver || this.isLevelComplete) {
      return;
    }

    // 1. Cập nhật chuyển động kẻ địch gai xoay
    for (const enemy of this.enemies) {
      enemy.updateEnemy(dt);
    }

    // 2. Cập nhật hiệu ứng gợn sóng mặt nước
    for (const water of this.waters) {
      water.updateWater(dt);
    }

    // Nếu bóng đang chết (đang nổ): không xử lý tiếp va chạm
    if (ball.isDead) {
      return;
    }

    // 3. Kiểm tra va chạm với Ring ('R')
    for (const ring of this.rings) {
      if (!ring.isCollected && ring.checkCollision(ball.x, ball.y, ball.radius)) {
        ring.collect();
        this.score += PHYSICS_CONFIG.POINTS_PER_RING;
        AudioManager.getInstance().playRing();

        if (this.remainingRings === 0 && this.exitGate) {
          this.exitGate.open();
          AudioManager.getInstance().playExitOpen();
        }

        this.notifyStatsChange();
      }
    }

    // 4. Kiểm tra va chạm với Gai ('S') và Kẻ địch gai xoay ('M')
    if (!ball.isInvincible && !ball.isDead) {
      // Va chạm gai
      for (const spike of this.spikes) {
        if (spike.checkCollision(ball.x, ball.y, ball.radius)) {
          this.handleBallDeath(ball);
          return;
        }
      }

      // Va chạm kẻ địch gai xoay
      for (const enemy of this.enemies) {
        if (enemy.checkCollision(ball.x, ball.y, ball.radius)) {
          this.handleBallDeath(ball);
          return;
        }
      }
    }

    // 5. Kiểm tra va chạm với Thanh nảy ('^')
    for (const bouncer of this.bouncers) {
      if (bouncer.checkCollision(ball)) {
        bouncer.trigger(ball);
        AudioManager.getInstance().playSpring();
      }
    }

    // 6. Kiểm tra va chạm với Ô Bơm phồng ('I')
    for (const pump of this.pumps) {
      if (pump.checkCollision(ball.x, ball.y, ball.radius)) {
        if (ball.form === 'small') {
          const success = ball.setForm('big', this.level);
          if (success) {
            pump.triggerEffect();
            AudioManager.getInstance().playInflate();
          }
        }
      }
    }

    // 7. Kiểm tra va chạm với Ô Xì xẹp ('D')
    for (const deflater of this.deflaters) {
      if (deflater.checkCollision(ball.x, ball.y, ball.radius)) {
        if (ball.form === 'big') {
          const success = ball.setForm('small', this.level);
          if (success) {
            deflater.triggerEffect();
            AudioManager.getInstance().playDeflate();
          }
        }
      }
    }

    // 8. Kiểm tra va chạm với Checkpoint ('C')
    for (const checkpoint of this.checkpoints) {
      if (!checkpoint.isActivated && checkpoint.checkCollision(ball.x, ball.y, ball.radius)) {
        if (checkpoint.activate()) {
          this.respawnPoint = { x: checkpoint.x, y: checkpoint.y };
          AudioManager.getInstance().playCheckpoint();
        }
      }
    }

    // 9. Kiểm tra va chạm với Cổng thoát ('E')
    if (this.exitGate && this.exitGate.isOpen) {
      if (this.exitGate.checkCollision(ball.x, ball.y, ball.radius)) {
        this.isLevelComplete = true;
        if (this.events?.onLevelComplete) {
          this.events.onLevelComplete();
        }
      }
    }
  }

  /**
   * Xử lý khi bóng phát nổ do chạm gai hoặc kẻ địch
   */
  private handleBallDeath(ball: Ball): void {
    ball.kill();
    AudioManager.getInstance().playDie();

    new ExplosionEffect(this.scene, ball.x, ball.y, () => {
      this.lives -= 1;
      this.notifyStatsChange();

      if (this.lives <= 0) {
        this.isGameOver = true;
        if (this.events?.onGameOver) {
          this.events.onGameOver();
        }
      } else {
        ball.respawn(this.respawnPoint.x, this.respawnPoint.y);
      }
    });
  }
}
