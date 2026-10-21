// src/config/physics.ts
// Chứa toàn bộ các hằng số vật lý theo quy định AGENTS.md

export const PHYSICS_CONFIG = {
  // Tần số cập nhật vật lý cố định (60Hz)
  FIXED_TIMESTEP: 1000 / 60, // mili-giây (16.666ms)
  FIXED_DELTA_TIME: 1 / 60,   // giây

  // Kích thước thế giới / logic (Màn hình ngang desktop 30x20 ô)
  LOGIC_WIDTH: 480,           // Chiều rộng logic màn hình ngang (px, 30 ô)
  LOGIC_HEIGHT: 320,          // Chiều cao logic màn hình ngang (px, 20 ô)
  TILE_SIZE: 16,              // Kích thước mỗi ô tile (px)

  // Thông số quả bóng dạng nhỏ (Small Ball: chuẩn khởi đầu)
  BALL_RADIUS_SMALL: 6,       // Bán kính quả bóng nhỏ (px)
  GRAVITY_SMALL: 750,         // Trọng lực dạng nhỏ (px/s^2)
  BOUNCE_VELOCITY_SMALL: 270, // Vận tốc nảy bình thường (px/s)
  JUMP_VELOCITY_SMALL: 320,   // Vận tốc bật nhảy dạng nhỏ (px/s, nhảy cao ~4.1 ô / 65.6px)
  MAX_FALL_SPEED_SMALL: 800,  // Vận tốc rơi tối đa dạng nhỏ (px/s)
  MOVE_ACCEL_SMALL: 360,      // Gia tốc di chuyển ngang dạng nhỏ (px/s^2)
  MAX_MOVE_SPEED_SMALL: 90,   // Vận tốc ngang tối đa dạng nhỏ (px/s)
  MOVE_DRAG_SMALL: 240,       // Lực ma sát hãm dạng nhỏ (px/s^2)

  // Thông số quả bóng dạng phồng (Big / Inflated Ball: nhẹ, nảy cao hơn, không lọt khe 1 ô)
  BALL_RADIUS_BIG: 11,        // Bán kính quả bóng phồng (px, đường kính 22px > 16px)
  GRAVITY_BIG: 620,           // Trọng lực nhẹ hơn dạng nhỏ (px/s^2)
  BOUNCE_VELOCITY_BIG: 320,   // Vận tốc nảy dạng phồng (px/s)
  JUMP_VELOCITY_BIG: 340,     // Vận tốc bật nhảy dạng phồng (px/s, nhảy cao ~5.8 ô)
  MAX_FALL_SPEED_BIG: 750,    // Vận tốc rơi tối đa dạng phồng (px/s)
  MOVE_ACCEL_BIG: 340,        // Gia tốc di chuyển ngang dạng phồng (px/s^2)
  MAX_MOVE_SPEED_BIG: 90,     // Vận tốc ngang tối đa dạng phồng (px/s)
  MOVE_DRAG_BIG: 240,         // Lực ma sát hãm dạng phồng (px/s^2)

  // Tương thích ngược mặc định
  BALL_RADIUS: 6,
  INITIAL_BALL_X: 120,
  INITIAL_BALL_Y: 200,
  GRAVITY: 750,
  BOUNCE_VELOCITY: 270,
  JUMP_VELOCITY: 320,
  MAX_FALL_SPEED: 800,
  MOVE_ACCEL: 360,
  MAX_MOVE_SPEED: 90,
  MOVE_DRAG: 240,

  // Thông số vật lý trong nước ('~')
  WATER_GRAVITY_SMALL: 130,        // Bóng nhỏ trong nước: chìm chậm (px/s^2)
  WATER_MAX_FALL_SPEED_SMALL: 70,  // Vận tốc chìm tối đa của bóng nhỏ (px/s)
  WATER_JUMP_VELOCITY_SMALL: 96,   // Vận tốc quẫy/nhảy trong nước của bóng nhỏ (px/s, nhảy cao ~2.1 ô / 34.6px)
  WATER_MAX_MOVE_SPEED_SMALL: 50,  // Vận tốc ngang tối đa trong nước (px/s)
  WATER_MOVE_ACCEL_SMALL: 220,     // Gia tốc ngang trong nước (px/s^2)
  WATER_MOVE_DRAG_SMALL: 280,      // Lực cản nước ngang (px/s^2)

  WATER_BUOYANCY_BIG: 380,         // Bóng phồng trong nước: nổi lên (gia tốc hướng lên, px/s^2)
  WATER_MAX_FLOAT_SPEED_BIG: -140, // Vận tốc nổi tối đa của bóng phồng (px/s)
  WATER_JUMP_VELOCITY_BIG: 200,    // Vận tốc nhảy trên mặt nước của bóng phồng (px/s)
  WATER_MAX_MOVE_SPEED_BIG: 55,    // Vận tốc ngang tối đa trong nước của bóng phồng (px/s)
  WATER_MOVE_ACCEL_BIG: 220,       // Gia tốc ngang trong nước của bóng phồng (px/s^2)
  WATER_MOVE_DRAG_BIG: 280,        // Lực cản nước ngang của bóng phồng (px/s^2)

  // Thông số thanh nảy ('^': Bắn bóng lên cao)
  SPRING_BOUNCE_VELOCITY_SMALL: 440, // Vận tốc bắn bóng nhỏ lên cao (px/s, cao ~8 ô)
  SPRING_BOUNCE_VELOCITY_BIG: 480,   // Vận tốc bắn bóng phồng lên cao (px/s, cao ~10 ô)
  SPRING_WIDTH: 16,                  // Chiều rộng thanh nảy (px)
  SPRING_HEIGHT: 8,                  // Chiều cao thanh nảy (px)

  // Thông số kẻ địch gai xoay ('M': di chuyển qua lại, chạm vào mất mạng)
  ENEMY_SPEED: 45,             // Tốc độ tuần tra của kẻ địch (px/s)
  ENEMY_ROTATION_SPEED: 3.5,   // Tốc độ xoay gai (rad/s)
  ENEMY_RADIUS: 7,             // Bán kính va chạm của kẻ địch (px)
  ENEMY_SPIKE_LENGTH: 3,       // Chiều dài gai nhọn bên ngoài (px)

  // Kích thước va chạm của bơm phồng ('I') và xì xẹp ('D') - bục gạch kiên cố 16x16px
  PUMP_WIDTH: 16,              // Chiều rộng ô bơm phồng (px)
  PUMP_HEIGHT: 16,             // Chiều cao ô bơm phồng (px)
  DEFLATER_WIDTH: 16,          // Chiều rộng ô xì xẹp (px)
  DEFLATER_HEIGHT: 16,         // Chiều cao ô xì xẹp (px)

  // Dung sai va chạm góc và mép ô (px)
  COLLISION_EPSILON: 0.05,

  // Thông số cuộn camera
  CAMERA_LERP_X: 0.1,
  CAMERA_LERP_Y: 0.1,

  // Gameplay & Game Loop
  INITIAL_LIVES: 5,           // Số mạng ban đầu
  POINTS_PER_RING: 500,       // Số điểm khi nhặt 1 ring
  INVINCIBILITY_DURATION: 1.0,// Thời gian bất tử sau khi hồi sinh (giây)
  EXPLOSION_DURATION: 0.5,    // Thời gian hiệu ứng nổ khi chạm gai (giây)

  // Kích thước va chạm của các đối tượng (px)
  RING_WIDTH: 10,             // Chiều rộng elip ring
  RING_HEIGHT: 14,            // Chiều cao elip ring
  SPIKE_WIDTH: 14,            // Chiều rộng gai
  SPIKE_HEIGHT: 12,           // Chiều cao gai
  CHECKPOINT_WIDTH: 12,       // Chiều rộng checkpoint
  CHECKPOINT_HEIGHT: 16,      // Chiều cao checkpoint
  EXIT_GATE_WIDTH: 16,        // Chiều rộng cổng thoát
  EXIT_GATE_HEIGHT: 20,       // Chiều cao cổng thoát
} as const;
