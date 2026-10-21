// src/objects/Ball.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config/physics';
import { LevelData } from '../levels/types';
import { AudioManager } from '../audio/AudioManager';

/**
 * Trạng thái phím điều khiển quả bóng
 */
export interface BallInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

/**
 * Tọa độ ô tile đang va chạm
 */
export interface TileCoord {
  x: number;
  y: number;
}

export type BallForm = 'small' | 'big';

/**
 * Class Ball đại diện cho quả bóng đỏ trong Bounce Classic (bản Nokia).
 * Hỗ trợ 2 dạng bóng:
 * - Bóng nhỏ ('small'): bán kính 6, nặng, nảy thấp, luồn được khe 1 ô (16px).
 * - Bóng phồng ('big'): bán kính 11, nhẹ, nảy cao hơn, không lọt khe 1 ô.
 * - Nổi lên trong nước nếu phồng, chìm chậm nếu nhỏ.
 */
export class Ball extends Phaser.GameObjects.Container {
  // Vận tốc hiện tại trên trục X và Y (pixel/giây)
  public vx: number = 0;
  public vy: number = 0;

  // Cờ báo bóng đang tiếp xúc mặt đất ở frame vật lý hiện tại
  public onGround: boolean = false;

  // Dạng bóng hiện tại: 'small' (bán kính 6) hoặc 'big' (bán kính 11)
  public form: BallForm = 'small';

  // Cờ báo bóng đang nằm trong nước ('~')
  public isInWater: boolean = false;

  // Bán kính động tùy theo dạng bóng
  public get radius(): number {
    return this.form === 'big'
      ? PHYSICS_CONFIG.BALL_RADIUS_BIG
      : PHYSICS_CONFIG.BALL_RADIUS_SMALL;
  }

  // Danh sách các ô tile đang va chạm trong frame vừa rồi (dùng cho debug)
  public collidingTiles: TileCoord[] = [];

  // Đối tượng đồ họa để vẽ bóng
  private ballGraphics: Phaser.GameObjects.Graphics;

  // Bộ đệm thời gian cho phím nhảy (jump buffer: 0.15s)
  private jumpBufferTimer: number = 0;

  // Trạng thái sống/chết và bất tử tạm thời sau khi hồi sinh
  public isDead: boolean = false;
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Khởi tạo đồ họa quả bóng
    this.ballGraphics = scene.add.graphics();
    this.drawBall();
    this.add(this.ballGraphics);

    // Đưa container vào scene
    scene.add.existing(this);
  }

  /**
   * Vẽ quả bóng đỏ retro với điểm phản quang và bóng sẫm theo bán kính hiện tại
   */
  public drawBall(): void {
    this.ballGraphics.clear();

    const r = this.radius;

    // Thân bóng màu đỏ tươi
    this.ballGraphics.fillStyle(0xee2222, 1);
    this.ballGraphics.fillCircle(0, 0, r);

    // Viền bóng màu đỏ sẫm
    this.ballGraphics.lineStyle(1, 0x881111, 1);
    this.ballGraphics.strokeCircle(0, 0, r);

    if (this.form === 'big') {
      // Bóng phồng to: điểm sáng phản quang rộng hơn
      this.ballGraphics.fillStyle(0xff9999, 0.9);
      this.ballGraphics.fillCircle(-3.5, -3.5, 2.5);

      this.ballGraphics.fillStyle(0x991111, 0.8);
      this.ballGraphics.fillCircle(3.5, 3.5, 2.5);
    } else {
      // Bóng nhỏ
      this.ballGraphics.fillStyle(0xff9999, 0.9);
      this.ballGraphics.fillCircle(-2, -2, 1.5);

      this.ballGraphics.fillStyle(0x991111, 0.8);
      this.ballGraphics.fillCircle(2, 2, 1.5);
    }
  }

  /**
   * Kiểm tra xem hình tròn bán kính targetRadius tại (targetX, targetY)
   * có bị va chạm với gạch '#' hoặc ra ngoài biên level không.
   */
  public checkSolidOverlap(
    targetX: number,
    targetY: number,
    targetRadius: number,
    level: LevelData
  ): boolean {
    const tileSize = PHYSICS_CONFIG.TILE_SIZE;
    const minTx = Math.floor((targetX - targetRadius) / tileSize);
    const maxTx = Math.floor((targetX + targetRadius) / tileSize);
    const minTy = Math.floor((targetY - targetRadius) / tileSize);
    const maxTy = Math.floor((targetY + targetRadius) / tileSize);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        // Ngoài biên level, gạch '#' hoặc bệ biến hình 'I'/'D' coi như vật cản cứng
        if (
          tx < 0 ||
          tx >= level.width ||
          ty < 0 ||
          ty >= level.height ||
          level.grid[ty][tx] === '#' ||
          level.grid[ty][tx] === 'I' ||
          level.grid[ty][tx] === 'D'
        ) {
          const tileMinX = tx * tileSize;
          const tileMaxX = (tx + 1) * tileSize;
          const tileMinY = ty * tileSize;
          const tileMaxY = (ty + 1) * tileSize;

          const closestX = Math.max(tileMinX, Math.min(targetX, tileMaxX));
          const closestY = Math.max(tileMinY, Math.min(targetY, tileMaxY));

          const dx = targetX - closestX;
          const dy = targetY - closestY;

          // Va chạm nếu khoảng cách bình phương nhỏ hơn bán kính bình phương
          if (dx * dx + dy * dy < targetRadius * targetRadius) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Thay đổi dạng bóng giữa 'small' và 'big'.
   * Nếu dạng mới bị kẹt trong gạch (vd phồng lên trong khe hẹp 1 ô),
   * hàm sẽ thử đẩy bóng ra vị trí trống gần nhất; nếu vẫn không vừa thì từ chối đổi.
   *
   * @param newForm Dạng mới muốn chuyển tới
   * @param level Dữ liệu bản đồ level hiện tại
   * @returns boolean true nếu đổi thành công, false nếu bị kẹt không cho đổi
   */
  public setForm(newForm: BallForm, level: LevelData): boolean {
    if (this.form === newForm) return true;

    if (newForm === 'big') {
      const targetRadius = PHYSICS_CONFIG.BALL_RADIUS_BIG;

      // 1. Kiểm tra vị trí hiện tại
      if (!this.checkSolidOverlap(this.x, this.y, targetRadius, level)) {
        this.form = 'big';
        this.drawBall();
        this.playTransformTween();
        return true;
      }

      // 2. Nếu chạm gạch, thử các độ lệch nhỏ (nudge) để tìm chỗ trống gần nhất
      const candidateOffsets = [
        { dx: 0, dy: -5 }, // Đứng trên bệ: nâng lên trên đúng 5px (11 - 6 = 5px)
        { dx: 0, dy: -6 },
        { dx: -5, dy: 0 }, // Chạm cạnh phải bệ: đẩy sang trái 5px
        { dx: -6, dy: 0 },
        { dx: 5, dy: 0 },  // Chạm cạnh trái bệ: đẩy sang phải 5px
        { dx: 6, dy: 0 },
        { dx: 0, dy: 5 },  // Chạm đáy bệ: đẩy xuống dưới 5px
        { dx: 0, dy: 6 },
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 },
        { dx: 0, dy: -4 },
        { dx: 0, dy: 4 },
        { dx: -4, dy: 0 },
        { dx: 4, dy: 0 },
        { dx: 0, dy: -8 },
        { dx: 0, dy: -10 },
      ];

      for (const offset of candidateOffsets) {
        const testX = this.x + offset.dx;
        const testY = this.y + offset.dy;
        if (!this.checkSolidOverlap(testX, testY, targetRadius, level)) {
          // Tìm thấy chỗ trống an toàn gần nhất
          this.x = testX;
          this.y = testY;
          this.form = 'big';
          this.drawBall();
          this.playTransformTween();
          return true;
        }
      }

      // Nếu tất cả vị trí đều kẹt (ví dụ khe hẹp 1 ô 16px không thể chứa bóng 22px) -> KHÔNG CHO ĐỔI
      return false;
    } else {
      // Thu nhỏ về 'small': bán kính 6 luôn nhỏ hơn 11 nên không bao giờ bị kẹt mới
      this.form = 'small';
      // Nếu đang tiếp sàn/bệ, hạ nhẹ tâm bóng 5px để chân bóng chạm sát mặt bệ
      if (this.onGround && !this.checkSolidOverlap(this.x, this.y + 5, PHYSICS_CONFIG.BALL_RADIUS_SMALL, level)) {
        this.y += 5;
      }
      this.drawBall();
      this.playTransformTween();
      return true;
    }
  }

  /**
   * Hiệu ứng chuyển dạng phồng/xẹp mượt mà
   */
  private playTransformTween(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 80,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setScale(1);
      },
    });
  }

  /**
   * Kích hoạt nảy bóng khi chạm thanh nảy / spring
   */
  public bounce(velocity?: number): void {
    const defaultVelocity =
      this.form === 'big'
        ? PHYSICS_CONFIG.BOUNCE_VELOCITY_BIG
        : PHYSICS_CONFIG.BOUNCE_VELOCITY_SMALL;
    this.vy = -(velocity ?? defaultVelocity);
    this.onGround = false;
  }

  /**
   * Ghi nhận ô tile đang va chạm để phục vụ hiển thị debug
   */
  private recordCollidingTile(tileX: number, tileY: number): void {
    const alreadyRecorded = this.collidingTiles.some(
      (tile) => tile.x === tileX && tile.y === tileY
    );
    if (!alreadyRecorded) {
      this.collidingTiles.push({ x: tileX, y: tileY });
    }
  }

  /**
   * Cập nhật chuyển động vật lý cố định (Fixed timestep 60Hz).
   * Xử lý riêng biệt trục X rồi trục Y, tích hợp hai dạng bóng và môi trường nước.
   *
   * @param input Trạng thái bàn phím điều khiển
   * @param dt Bước thời gian cố định (giây)
   * @param level Dữ liệu bản đồ level hiện tại
   */
  public fixedUpdate(input: BallInputState, dt: number, level: LevelData): void {
    if (this.isDead) return;

    // Đếm ngược thời gian bất tử và nhấp nháy hiển thị
    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.setAlpha(1);
      } else {
        const blink = Math.floor(this.invincibleTimer * 12) % 2 === 0;
        this.setAlpha(blink ? 0.25 : 0.9);
      }
    }

    this.collidingTiles = [];
    const tileSize = PHYSICS_CONFIG.TILE_SIZE;
    const eps = PHYSICS_CONFIG.COLLISION_EPSILON;
    const currentRadius = this.radius;

    // -------------------------------------------------------------
    // Kiểm tra bóng có đang nằm trong nước ('~') hay không
    // -------------------------------------------------------------
    const waterMinTx = Math.floor((this.x - currentRadius) / tileSize);
    const waterMaxTx = Math.floor((this.x + currentRadius) / tileSize);
    const waterMinTy = Math.floor((this.y - currentRadius) / tileSize);
    const waterMaxTy = Math.floor((this.y + currentRadius) / tileSize);

    let foundWater = false;
    for (let ty = waterMinTy; ty <= waterMaxTy; ty++) {
      for (let tx = waterMinTx; tx <= waterMaxTx; tx++) {
        if (
          tx >= 0 &&
          tx < level.width &&
          ty >= 0 &&
          ty < level.height
        ) {
          const char = level.grid[ty][tx];
          if (
            char === '~' ||
            ((char === 'R' || char === 'I') && ty > 0 && level.grid[ty - 1][tx] === '~')
          ) {
            foundWater = true;
            break;
          }
        }
      }
      if (foundWater) break;
    }
    this.isInWater = foundWater;

    // Hàm kiểm tra ô cản trở '#' hoặc bệ biến hình 'I'/'D' (có tính chất như gạch)
    const isSolid = (tx: number, ty: number): boolean => {
      if (tx < 0 || tx >= level.width || ty < 0 || ty >= level.height) {
        return true;
      }
      const char = level.grid[ty][tx];
      return char === '#' || char === 'I' || char === 'D';
    };

    // Quản lý bộ đệm nhảy (Jump Buffering)
    if (input.jump) {
      this.jumpBufferTimer = 0.15;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // -------------------------------------------------------------
    // Lựa chọn hằng số vật lý tùy theo dạng bóng và môi trường nước
    // -------------------------------------------------------------
    let moveAccel: number;
    let maxMoveSpeed: number;
    let moveDrag: number;

    if (this.isInWater) {
      if (this.form === 'big') {
        moveAccel = PHYSICS_CONFIG.WATER_MOVE_ACCEL_BIG;
        maxMoveSpeed = PHYSICS_CONFIG.WATER_MAX_MOVE_SPEED_BIG;
        moveDrag = PHYSICS_CONFIG.WATER_MOVE_DRAG_BIG;
      } else {
        moveAccel = PHYSICS_CONFIG.WATER_MOVE_ACCEL_SMALL;
        maxMoveSpeed = PHYSICS_CONFIG.WATER_MAX_MOVE_SPEED_SMALL;
        moveDrag = PHYSICS_CONFIG.WATER_MOVE_DRAG_SMALL;
      }
    } else {
      if (this.form === 'big') {
        moveAccel = PHYSICS_CONFIG.MOVE_ACCEL_BIG;
        maxMoveSpeed = PHYSICS_CONFIG.MAX_MOVE_SPEED_BIG;
        moveDrag = PHYSICS_CONFIG.MOVE_DRAG_BIG;
      } else {
        moveAccel = PHYSICS_CONFIG.MOVE_ACCEL_SMALL;
        maxMoveSpeed = PHYSICS_CONFIG.MAX_MOVE_SPEED_SMALL;
        moveDrag = PHYSICS_CONFIG.MOVE_DRAG_SMALL;
      }
    }

    // =============================================================
    // 1. XỬ LÝ TRỤC X: Di chuyển ngang và giải quyết va chạm tường
    // =============================================================
    if (input.left && !input.right) {
      this.vx -= moveAccel * dt;
      if (this.vx < -maxMoveSpeed) {
        this.vx = -maxMoveSpeed;
      }
    } else if (input.right && !input.left) {
      this.vx += moveAccel * dt;
      if (this.vx > maxMoveSpeed) {
        this.vx = maxMoveSpeed;
      }
    } else {
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - moveDrag * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + moveDrag * dt);
      }
    }

    // Di chuyển vị trí X
    this.x += this.vx * dt;

    // Hiệu ứng xoay tròn quả bóng khi lăn
    if (this.vx !== 0) {
      this.ballGraphics.rotation += (this.vx / currentRadius) * dt;
    }

    // Giới hạn biên level bên trái / bên phải
    if (this.x - currentRadius < 0) {
      this.x = currentRadius;
      this.vx = 0;
    } else if (this.x + currentRadius > level.widthPx) {
      this.x = level.widthPx - currentRadius;
      this.vx = 0;
    }

    // Kiểm tra va chạm tile trên trục X bằng AABB
    const topTileY = Math.floor((this.y - currentRadius + eps) / tileSize);
    const bottomTileY = Math.floor((this.y + currentRadius - eps) / tileSize);

    if (this.vx > 0) {
      const rightTileX = Math.floor((this.x + currentRadius) / tileSize);
      let hitWallRight = false;

      for (let ty = topTileY; ty <= bottomTileY; ty++) {
        if (isSolid(rightTileX, ty)) {
          hitWallRight = true;
          this.recordCollidingTile(rightTileX, ty);
        }
      }

      if (hitWallRight) {
        // Khi bóng ở trong nước chạm mép sàn gạch ngang bằng với mặt nước:
        // Tự động nâng nhẹ bóng lên mặt sàn bờ ao để thoát ra êm ái
        const shoreTileY = bottomTileY;
        const shoreTopY = shoreTileY * tileSize;
        const hasClearance =
          !isSolid(rightTileX, shoreTileY - 1) &&
          (this.form === 'small' || !isSolid(rightTileX, shoreTileY - 2));

        if (
          this.isInWater &&
          hasClearance &&
          this.y <= shoreTopY + currentRadius * 0.75
        ) {
          this.y = shoreTopY - currentRadius;
          this.onGround = true;
          hitWallRight = false;
        }

        if (hitWallRight) {
          this.x = rightTileX * tileSize - currentRadius;
          this.vx = 0;
        }
      }
    } else if (this.vx < 0) {
      const leftTileX = Math.floor((this.x - currentRadius) / tileSize);
      let hitWallLeft = false;

      for (let ty = topTileY; ty <= bottomTileY; ty++) {
        if (isSolid(leftTileX, ty)) {
          hitWallLeft = true;
          this.recordCollidingTile(leftTileX, ty);
        }
      }

      if (hitWallLeft) {
        // Tương tự cho mép bờ bên trái
        const shoreTileY = bottomTileY;
        const shoreTopY = shoreTileY * tileSize;
        const hasClearance =
          !isSolid(leftTileX, shoreTileY - 1) &&
          (this.form === 'small' || !isSolid(leftTileX, shoreTileY - 2));

        if (
          this.isInWater &&
          hasClearance &&
          this.y <= shoreTopY + currentRadius * 0.75
        ) {
          this.y = shoreTopY - currentRadius;
          this.onGround = true;
          hitWallLeft = false;
        }

        if (hitWallLeft) {
          this.x = (leftTileX + 1) * tileSize + currentRadius;
          this.vx = 0;
        }
      }
    }

    // =============================================================
    // 2. XỬ LÝ TRỤC Y: Trọng lực, Nổi/Chìm trong nước, Tiếp đất và Nhảy
    // =============================================================
    if (this.isInWater) {
      if (this.form === 'big') {
        // Bóng phồng trong nước: TỰ ĐỘNG NỔI LÊN (buoyancy như phao bơi)
        // Không nhận phím nhảy trong nước, chỉ cần điều khiển Trái/Phải
        this.vy -= PHYSICS_CONFIG.WATER_BUOYANCY_BIG * dt;
        if (this.vy < PHYSICS_CONFIG.WATER_MAX_FLOAT_SPEED_BIG) {
          this.vy = PHYSICS_CONFIG.WATER_MAX_FLOAT_SPEED_BIG;
        }
      } else {
        // Bóng nhỏ trong nước: CHÌM CHẬM XUỐNG ĐÁY HỒ
        // Chuẩn: Không thể nhảy trong nước, chỉ di chuyển trái/phải
        this.vy += PHYSICS_CONFIG.WATER_GRAVITY_SMALL * dt;
        if (this.vy > PHYSICS_CONFIG.WATER_MAX_FALL_SPEED_SMALL) {
          this.vy = PHYSICS_CONFIG.WATER_MAX_FALL_SPEED_SMALL;
        }
      }
    } else {
      // Trong không khí: tác dụng trọng lực theo dạng bóng
      const gravity =
        this.form === 'big'
          ? PHYSICS_CONFIG.GRAVITY_BIG
          : PHYSICS_CONFIG.GRAVITY_SMALL;
      const maxFallSpeed =
        this.form === 'big'
          ? PHYSICS_CONFIG.MAX_FALL_SPEED_BIG
          : PHYSICS_CONFIG.MAX_FALL_SPEED_SMALL;

      this.vy += gravity * dt;
      if (this.vy > maxFallSpeed) {
        this.vy = maxFallSpeed;
      }
    }

    // Di chuyển vị trí Y
    this.y += this.vy * dt;

    // Kiểm tra va chạm tile trên trục Y bằng AABB
    const leftTileX = Math.floor((this.x - currentRadius + eps) / tileSize);
    const rightTileX = Math.floor((this.x + currentRadius - eps) / tileSize);

    if (this.vy >= 0) {
      // Đang rơi xuống hoặc chạm sàn
      const floorTileY = Math.floor((this.y + currentRadius) / tileSize);
      let hitFloor = false;

      for (let tx = leftTileX; tx <= rightTileX; tx++) {
        if (isSolid(tx, floorTileY)) {
          hitFloor = true;
          this.recordCollidingTile(tx, floorTileY);
        }
      }

      if (hitFloor) {
        const wasInAir = !this.onGround;
        const impactVy = this.vy;

        this.y = floorTileY * tileSize - currentRadius;
        this.onGround = true;

        const isJumpRequested = input.jump || this.jumpBufferTimer > 0;
        if (isJumpRequested) {
          if (this.isInWater) {
            // Khi ở trong nước: Quả bóng thường (small) nhảy lên cao 2 ô
            const waterJumpVelocity =
              this.form === 'big'
                ? PHYSICS_CONFIG.WATER_JUMP_VELOCITY_BIG
                : PHYSICS_CONFIG.WATER_JUMP_VELOCITY_SMALL;
            this.vy = -waterJumpVelocity;
            this.jumpBufferTimer = 0;
            this.onGround = false;
            AudioManager.getInstance().playJump();
          } else {
            // Trên cạn: Nhảy bình thường theo dạng bóng (bóng thường nhảy cao 4 ô)
            const jumpVelocity =
              this.form === 'big'
                ? PHYSICS_CONFIG.JUMP_VELOCITY_BIG
                : PHYSICS_CONFIG.JUMP_VELOCITY_SMALL;
            this.vy = -jumpVelocity;
            this.jumpBufferTimer = 0;
            this.onGround = false;
            AudioManager.getInstance().playJump();
          }
        } else {
          this.vy = 0;
          // Phát âm thanh chạm sàn khi rơi từ trên không xuống
          if (wasInAir && impactVy > 30) {
            AudioManager.getInstance().playBounce(this.form);
          }
        }
      } else {
        this.onGround = false;
      }
    } else if (this.vy < 0) {
      // Đang bay lên (hoặc bóng phồng đang nổi lên chạm trần)
      const ceilingTileY = Math.floor((this.y - currentRadius) / tileSize);
      let hitCeiling = false;

      for (let tx = leftTileX; tx <= rightTileX; tx++) {
        if (isSolid(tx, ceilingTileY)) {
          hitCeiling = true;
          this.recordCollidingTile(tx, ceilingTileY);
        }
      }

      if (hitCeiling) {
        this.y = (ceilingTileY + 1) * tileSize + currentRadius;
        this.vy = 0;
      }
    }

    // Giới hạn biên level trên/dưới
    if (this.y - currentRadius < 0) {
      this.y = currentRadius;
      this.vy = 0;
    } else if (this.y + currentRadius > level.heightPx) {
      if (!this.onGround && this.vy > 30) {
        AudioManager.getInstance().playBounce(this.form);
      }
      this.y = level.heightPx - currentRadius;
      this.vy = 0;
      this.onGround = true;
    }
  }

  /**
   * Xử lý khi bóng bị trúng gai / kẻ địch (bóng nổ)
   */
  public kill(): void {
    this.isDead = true;
    this.vx = 0;
    this.vy = 0;
    this.setVisible(false);
  }

  /**
   * Hồi sinh bóng tại vị trí xác định với 1 giây bất tử
   */
  public respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpBufferTimer = 0;
    this.isDead = false;
    this.isInvincible = true;
    this.invincibleTimer = PHYSICS_CONFIG.INVINCIBILITY_DURATION;
    // Khi hồi sinh đặt lại về dạng nhỏ chuẩn
    this.form = 'small';
    this.drawBall();
    this.setVisible(true);
    this.setAlpha(1);
  }

  /**
   * Đặt lại trạng thái bóng về vị trí chỉ định
   */
  public reset(x: number, y: number): void {
    this.setPosition(x, y);
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpBufferTimer = 0;
    this.collidingTiles = [];
    this.ballGraphics.rotation = 0;
    this.isDead = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.form = 'small';
    this.drawBall();
    this.setVisible(true);
    this.setAlpha(1);
  }
}
