// src/levels/index.ts
import { LEVEL_1 } from './level1';
import { LevelData } from './types';

/**
 * Danh sách toàn bộ các màn chơi (LEVELS) trong game
 */
export const LEVELS: LevelData[] = [
  LEVEL_1,
];

export { LEVEL_1, LEVEL_1_RAW } from './level1';
export * from './types';
