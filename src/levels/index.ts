import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';
import { LEVEL_3 } from './level3';
import { LEVEL_4 } from './level4';
import { LevelData } from './types';

/**
 * Danh sách toàn bộ các màn chơi (LEVELS) trong game
 */
export const LEVELS: LevelData[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
];

export { LEVEL_1, LEVEL_1_RAW } from './level1';
export { LEVEL_2, LEVEL_2_RAW } from './level2';
export { LEVEL_3, LEVEL_3_RAW } from './level3';
export { LEVEL_4, LEVEL_4_RAW } from './level4';
export * from './types';

