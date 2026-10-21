// src/tools/validateLevel.ts
// Tool tự động kiểm tra tính hợp lệ và khả năng hoàn thành của các Level trong game.
// Sử dụng thuật toán Flood-fill / BFS để mô phỏng di chuyển thực tế của quả bóng:
// - Đi ngang, rơi do trọng lực
// - Nhảy bậc (tối đa 2 ô đối với bóng nhỏ, 4 ô đối với bóng phồng)
// - Bật nảy bởi thanh lò xo '^' (7-8 ô cho bóng nhỏ, 10-11 ô cho bóng phồng)
// - Chìm / Nổi trong hồ nước '~' (bóng nhỏ chìm, bóng to nổi)
// - Đổi dạng bóng: Bơm phồng 'I' và Xì xẹp 'D'
// - Kiểm tra xem có thể thu thập đủ tất cả 'R' và đi tới cổng thoát 'E' hay không.

import { parseLevel, LevelData } from '../levels/types';
import { LEVEL_1_RAW } from '../levels/level1';
import { LEVEL_2_RAW } from '../levels/level2';
import { LEVEL_3_RAW } from '../levels/level3';
import { LEVEL_4_RAW } from '../levels/level4';
import { LEVEL_5_RAW } from '../levels/level5';
import { LEVEL_6_RAW } from '../levels/level6';
import { LEVEL_7_RAW } from '../levels/level7';
import { LEVEL_8_RAW } from '../levels/level8';
import { LEVEL_9_RAW } from '../levels/level9';
import { LEVEL_10_RAW } from '../levels/level10';

// Khai báo kiểu process khi chạy môi trường Node.js CLI
declare const process: { argv: string[] };

export interface ValidationResult {
  levelNumber: number;
  width: number;
  height: number;
  totalRings: number;
  collectedRings: number;
  exitReached: boolean;
  unreachedRings: { x: number; y: number }[];
  isSolvable: boolean;
  visitedStatesCount: number;
}

type BallForm = 'small' | 'big';

interface State {
  x: number;
  y: number;
  form: BallForm;
}

export function validateLevel(levelRaw: string[], levelNumber: number): ValidationResult {
  const level: LevelData = parseLevel(levelRaw);
  const width = level.width;
  const height = level.height;

  // 1. Tìm tất cả các ring 'R' và điểm xuất phát 'P'
  const ringPositions: { x: number; y: number }[] = [];
  let spawnPos: { x: number; y: number } | null = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = level.grid[y][x];
      if (char === 'R') {
        ringPositions.push({ x, y });
      } else if (char === 'P') {
        spawnPos = { x, y };
      }
    }
  }

  if (!spawnPos) {
    throw new Error(`Level ${levelNumber} không có điểm xuất phát 'P'!`);
  }

  // 2. BFS khám phá mọi vị trí có thể tới được
  const visited = new Set<string>();
  const queue: State[] = [];

  const startState: State = { x: spawnPos.x, y: spawnPos.y, form: 'small' };
  visited.add(`${startState.x},${startState.y},${startState.form}`);
  queue.push(startState);

  const reachableRings = new Set<string>();
  let reachedExit = false;

  const isSolid = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return true;
    const char = level.grid[y][x];
    return char === '#' || char === 'I' || char === 'D';
  };

  const isHazard = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return level.grid[y][x] === 'S';
  };

  const isWater = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const char = level.grid[y][x];
    return char === '~' || ((char === 'R' || char === 'I') && y > 0 && level.grid[y - 1][x] === '~');
  };

  const canPass = (x: number, y: number, form: BallForm): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    if (isSolid(x, y) || isHazard(x, y)) return false;
    if (form === 'big') {
      // Bóng to cần khoảng trống ít nhất 2 ô (không kẹt trong khe 1 ô)
      // Kiểm tra ô bên trên hoặc bên cạnh
      if (y > 0 && isSolid(x, y - 1) && y < height - 1 && isSolid(x, y + 1)) {
        return false;
      }
    }
    return true;
  };

  const enqueue = (x: number, y: number, form: BallForm) => {
    if (!canPass(x, y, form)) return;
    const key = `${x},${y},${form}`;
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ x, y, form });
    }
  };

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const { x, y, form } = cur;
    const char = level.grid[y][x];

    // Kiểm tra thu thập Ring
    if (char === 'R') {
      reachableRings.add(`${x},${y}`);
    }

    // Kiểm tra tới cổng thoát E
    if (char === 'E') {
      reachedExit = true;
    }

    // Biến hình nếu tiếp xúc với Bơm 'I' hoặc Xì xẹp 'D' (đứng trên bệ hoặc chạm sườn)
    let effectiveForm = form;
    const adjacentChars = [
      level.grid[y + 1]?.[x], // đứng trên bệ
      level.grid[y]?.[x + 1], // chạm sườn phải
      level.grid[y]?.[x - 1], // chạm sườn trái
      level.grid[y - 1]?.[x], // chạm đáy bệ
    ];

    if (adjacentChars.includes('I')) {
      if (canPass(x, y, 'big')) {
        effectiveForm = 'big';
        enqueue(x, y, 'big');
      }
    }
    if (adjacentChars.includes('D')) {
      if (canPass(x, y, 'small')) {
        effectiveForm = 'small';
        enqueue(x, y, 'small');
      }
    }

    const inWater = isWater(x, y);

    if (inWater) {
      // -------------------------------------------------------------
      // VẬT LÝ DƯỚI NƯỚC '~'
      // -------------------------------------------------------------
      // Có thể di chuyển trái / phải
      if (canPass(x - 1, y, effectiveForm)) enqueue(x - 1, y, effectiveForm);
      if (canPass(x + 1, y, effectiveForm)) enqueue(x + 1, y, effectiveForm);

      if (effectiveForm === 'small') {
        // Bóng nhỏ: tự động chìm xuống
        if (canPass(x, y + 1, effectiveForm)) {
          enqueue(x, y + 1, effectiveForm);
        }

        // Nhảy trong nước: bóng nhỏ tiếp sàn đáy hồ có thể nhảy lên 2 ô
        const onFloorInWater = isSolid(x, y + 1);
        if (onFloorInWater) {
          for (let h = 1; h <= 2; h++) {
            if (isSolid(x, y - h)) break;
            enqueue(x, y - h, effectiveForm);
            for (const dx of [-1, 1]) {
              if (canPass(x + dx, y - h, effectiveForm)) {
                enqueue(x + dx, y - h, effectiveForm);
              }
            }
          }
        }
      } else {
        // Bóng to: tự động nổi lên
        if (canPass(x, y - 1, effectiveForm)) {
          enqueue(x, y - 1, effectiveForm);
        }
        // Khi nổi tới mặt nước:
        // Chỉ có thể lăn Trái / Phải hoặc bước lên bờ hồ ngang bằng (flush shore)
        const isSurface = !isWater(x, y - 1);
        if (isSurface) {
          // Bước sang bờ hồ bên phải (nếu mặt nước ngang bằng với mặt sàn)
          if (isSolid(x + 1, y) && canPass(x + 1, y - 1, effectiveForm)) {
            enqueue(x + 1, y - 1, effectiveForm);
          } else if (canPass(x + 1, y, effectiveForm)) {
            enqueue(x + 1, y, effectiveForm);
          }

          // Bước sang bờ hồ bên trái (nếu mặt nước ngang bằng với mặt sàn)
          if (isSolid(x - 1, y) && canPass(x - 1, y - 1, effectiveForm)) {
            enqueue(x - 1, y - 1, effectiveForm);
          } else if (canPass(x - 1, y, effectiveForm)) {
            enqueue(x - 1, y, effectiveForm);
          }
        }
      }
    } else {
      // -------------------------------------------------------------
      // VẬT LÝ TRÊN CẠN
      // -------------------------------------------------------------
      const onFloor = isSolid(x, y + 1) || level.grid[y + 1]?.[x] === '^';
      const onSpring = level.grid[y][x] === '^' || level.grid[y + 1]?.[x] === '^';

      if (onSpring) {
        // Bật lò xo: bóng nhỏ bay cao 7-8 ô, bóng to bay cao 10-11 ô
        const maxSpringHeight = effectiveForm === 'big' ? 10 : 8;
        for (let h = 1; h <= maxSpringHeight; h++) {
          if (isSolid(x, y - h)) break;
          enqueue(x, y - h, effectiveForm);
          // Cho phép liệng ngang ở đỉnh bật nảy
          if (h >= maxSpringHeight - 2) {
            for (let dx = -3; dx <= 3; dx++) {
              if (canPass(x + dx, y - h, effectiveForm)) {
                enqueue(x + dx, y - h, effectiveForm);
              }
            }
          }
        }
      }

      if (onFloor) {
        // Đi bộ ngang
        if (canPass(x - 1, y, effectiveForm)) enqueue(x - 1, y, effectiveForm);
        if (canPass(x + 1, y, effectiveForm)) enqueue(x + 1, y, effectiveForm);

        // Nhảy:
        // Bóng nhỏ: nhảy cao tối đa 3-4 ô (nhảy được 4 ô)
        // Bóng to: nhảy cao tối đa 4-5 ô
        const maxJumpH = effectiveForm === 'big' ? 4 : 3;
        const maxJumpDist = effectiveForm === 'big' ? 4 : 4;

        // Nhảy thẳng đứng để nhặt ring trên đầu
        for (let h = 1; h <= (effectiveForm === 'big' ? 5 : 4); h++) {
          if (isSolid(x, y - h)) break;
          enqueue(x, y - h, effectiveForm);
        }

        // Nhảy bậc thang hoặc nhảy qua hố
        for (let dy = 1; dy <= maxJumpH; dy++) {
          if (isSolid(x, y - 1)) break; // trần chặn không nhảy được
          for (let dx = -maxJumpDist; dx <= maxJumpDist; dx++) {
            if (dx === 0) continue;
            // Kiểm tra đường nhảy hình cung đơn giản
            const targetX = x + dx;
            const targetY = y - dy;
            if (canPass(targetX, targetY, effectiveForm)) {
              enqueue(targetX, targetY, effectiveForm);
            }
          }
        }
      } else {
        // Đang rơi tự do: rơi xuống y + 1 và có thể liệng nhẹ sang trái / phải
        if (canPass(x, y + 1, effectiveForm)) enqueue(x, y + 1, effectiveForm);
        if (canPass(x - 1, y + 1, effectiveForm)) enqueue(x - 1, y + 1, effectiveForm);
        if (canPass(x + 1, y + 1, effectiveForm)) enqueue(x + 1, y + 1, effectiveForm);
      }
    }
  }

  // 3. Tổng hợp kết quả
  const unreachedRings: { x: number; y: number }[] = [];
  for (const ring of ringPositions) {
    if (!reachableRings.has(`${ring.x},${ring.y}`)) {
      unreachedRings.push(ring);
    }
  }

  const collectedRings = reachableRings.size;
  const isSolvable = collectedRings === ringPositions.length && reachedExit;

  return {
    levelNumber,
    width,
    height,
    totalRings: ringPositions.length,
    collectedRings,
    exitReached: reachedExit,
    unreachedRings,
    isSolvable,
    visitedStatesCount: visited.size,
  };
}

// Chạy trực tiếp nếu file được gọi từ CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validateLevel.ts')) {
  console.log('====================================================');
  console.log('  BOUNCE CLASSIC - BỘ KIỂM ĐỊNH MAP LEVEL (FLOOD-FILL)');
  console.log('====================================================\n');

  const levelsToTest = [
    { num: 1, raw: LEVEL_1_RAW },
    { num: 2, raw: LEVEL_2_RAW },
    { num: 3, raw: LEVEL_3_RAW },
    { num: 4, raw: LEVEL_4_RAW },
    { num: 5, raw: LEVEL_5_RAW },
    { num: 6, raw: LEVEL_6_RAW },
    { num: 7, raw: LEVEL_7_RAW },
    { num: 8, raw: LEVEL_8_RAW },
    { num: 9, raw: LEVEL_9_RAW },
    { num: 10, raw: LEVEL_10_RAW },
  ];

  let allPassed = true;

  for (const lvl of levelsToTest) {
    const res = validateLevel(lvl.raw, lvl.num);
    const status = res.isSolvable ? '✓ PASS (Hoàn thành 100%)' : '✗ FAIL (Không giải được)';
    console.log(`[Level ${res.levelNumber}] ${res.width}x${res.height} ô | Ring: ${res.collectedRings}/${res.totalRings} | Exit: ${res.exitReached ? 'ĐẠT' : 'CHƯA'} | Trạng thái: ${status}`);
    if (!res.isSolvable) {
      allPassed = false;
      if (res.unreachedRings.length > 0) {
        console.log(`  -> Ring chưa tới được: ${JSON.stringify(res.unreachedRings)}`);
      }
      if (!res.exitReached) {
        console.log(`  -> Cổng thoát E không thể chạm tới!`);
      }
    }
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('  TẤT CẢ LEVEL ĐỀU VƯỢT QUA KIỂM ĐỊNH THÀNH CÔNG!');
  } else {
    console.log('  CÓ LEVEL CHƯA ĐẠT YÊU CẦU, CẦN ĐIỀU CHỈNH MAP!');
  }
  console.log('====================================================');
}
