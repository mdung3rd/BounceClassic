// src/levels/types.ts
import { PHYSICS_CONFIG } from '../config/physics';

/**
 * Định nghĩa cấu hình tuần tra của kẻ địch gai xoay ('M')
 */
export interface EnemyDef {
  x: number;       // Tọa độ X ban đầu (px)
  y: number;       // Tọa độ Y ban đầu (px)
  minX: number;    // Giới hạn tuần tra bên trái (px)
  maxX: number;    // Giới hạn tuần tra bên phải (px)
  speed?: number;  // Tốc độ tuần tra (px/s)
}

/**
 * Cấu trúc dữ liệu của level sau khi parse
 */
export interface LevelData {
  width: number;       // Số cột (ô)
  height: number;      // Số hàng (ô)
  widthPx: number;     // Chiều rộng theo pixel
  heightPx: number;    // Chiều cao theo pixel
  grid: string[][];    // Lưới 2 chiều [y][x] tương ứng [hàng][cột]
  spawnX: number;      // Tọa độ pixel ban đầu quả bóng (từ ký hiệu 'P')
  spawnY: number;      // Tọa độ pixel ban đầu quả bóng (từ ký hiệu 'P')
  enemies: EnemyDef[]; // Danh sách kẻ địch tuần tra trong level
  raw: string[];       // Mảng chuỗi ký tự thô
}

/**
 * Hàm phân tích mảng chuỗi ký tự thành cấu trúc LevelData dạng lưới 2 chiều
 *
 * @param rawRows Mảng chuỗi ký tự đại diện cho các hàng của level
 * @param customEnemies Danh sách định nghĩa kẻ địch tùy biến (nếu có)
 */
export function parseLevel(rawRows: string[], customEnemies?: EnemyDef[]): LevelData {
  const height = rawRows.length;
  const width = Math.max(...rawRows.map((row) => row.length));
  const grid: string[][] = [];

  let spawnX = PHYSICS_CONFIG.INITIAL_BALL_X;
  let spawnY = PHYSICS_CONFIG.INITIAL_BALL_Y;
  const autoEnemies: EnemyDef[] = [];
  const tileSize = PHYSICS_CONFIG.TILE_SIZE;
  const halfTile = tileSize / 2;

  for (let y = 0; y < height; y++) {
    const row = rawRows[y];
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      const char = x < row.length ? row[x] : '.';
      grid[y][x] = char;

      // Điểm xuất phát của bóng
      if (char === 'P') {
        spawnX = x * tileSize + halfTile;
        spawnY = y * tileSize + halfTile;
      }
    }
  }

  // Tự động phân tích các ký tự 'M' để xác định đoạn đường tuần tra
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 'M') {
        // Tìm tường '#' bên trái
        let leftWallX = 0;
        for (let checkX = x - 1; checkX >= 0; checkX--) {
          if (grid[y][checkX] === '#') {
            leftWallX = checkX + 1;
            break;
          }
        }

        // Tìm tường '#' bên phải
        let rightWallX = width - 1;
        for (let checkX = x + 1; checkX < width; checkX++) {
          if (grid[y][checkX] === '#') {
            rightWallX = checkX - 1;
            break;
          }
        }

        const minX = leftWallX * tileSize + halfTile;
        const maxX = rightWallX * tileSize + halfTile;

        autoEnemies.push({
          x: x * tileSize + halfTile,
          y: y * tileSize + halfTile,
          minX: Math.min(minX, x * tileSize + halfTile),
          maxX: Math.max(maxX, x * tileSize + halfTile),
          speed: PHYSICS_CONFIG.ENEMY_SPEED,
        });
      }
    }
  }

  return {
    width,
    height,
    widthPx: width * tileSize,
    heightPx: height * tileSize,
    grid,
    spawnX,
    spawnY,
    enemies: customEnemies ?? autoEnemies,
    raw: rawRows,
  };
}
