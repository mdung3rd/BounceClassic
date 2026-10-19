// src/utils/save.ts

/**
 * Cấu trúc dữ liệu lưu trữ tiến trình game trong localStorage
 */
export interface GameSaveData {
  unlockedLevel: number;             // Index màn chơi mở khoá cao nhất (bắt đầu từ 0)
  highScores: Record<number, number>; // Kỷ lục điểm số theo từng level (0-based index)
}

const STORAGE_KEY = 'bounce_classic_save_v1';

/**
 * Trả về dữ liệu mặc định khi chưa có bản lưu hoặc khi gặp lỗi đọc
 */
function getDefaultSaveData(): GameSaveData {
  return {
    unlockedLevel: 0,
    highScores: {},
  };
}

/**
 * Đọc toàn bộ dữ liệu lưu trữ từ localStorage (được bọc try/catch chống crash)
 */
export function loadSaveData(): GameSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultSaveData();
    }
    const parsed = JSON.parse(raw) as Partial<GameSaveData>;
    return {
      unlockedLevel: typeof parsed.unlockedLevel === 'number' && parsed.unlockedLevel >= 0 ? parsed.unlockedLevel : 0,
      highScores: parsed.highScores && typeof parsed.highScores === 'object' ? parsed.highScores : {},
    };
  } catch (error) {
    console.warn('[SaveSystem] Không thể đọc dữ liệu từ localStorage:', error);
    return getDefaultSaveData();
  }
}

/**
 * Ghi toàn bộ dữ liệu lưu trữ vào localStorage (được bọc try/catch chống crash)
 */
export function saveGameData(data: GameSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[SaveSystem] Không thể ghi dữ liệu vào localStorage:', error);
  }
}

/**
 * Lấy index của level mở khoá cao nhất (0-based)
 */
export function getHighestUnlockedLevel(): number {
  const data = loadSaveData();
  return data.unlockedLevel;
}

/**
 * Kiểm tra xem một level cụ thể đã được mở khóa hay chưa
 */
export function isLevelUnlocked(levelIndex: number): boolean {
  if (levelIndex <= 0) return true; // Level 0 (Level 1) luôn luôn được mở khoá
  const data = loadSaveData();
  return levelIndex <= data.unlockedLevel;
}

/**
 * Lấy điểm cao nhất của một level
 */
export function getHighScore(levelIndex: number): number {
  const data = loadSaveData();
  return data.highScores[levelIndex] || 0;
}

/**
 * Cập nhật điểm cao và mở khoá level tiếp theo khi thắng màn chơi
 *
 * @param levelIndex Index của level vừa hoàn thành (0-based)
 * @param score Điểm số đạt được trong màn chơi
 * @returns Thông tin kỷ lục mới và mở khoá màn tiếp theo
 */
export function saveLevelProgress(
  levelIndex: number,
  score: number
): { isNewHighScore: boolean; nextLevelUnlocked: boolean; highScore: number } {
  const data = loadSaveData();
  const currentHighScore = data.highScores[levelIndex] || 0;
  const isNewHighScore = score > currentHighScore;

  if (isNewHighScore) {
    data.highScores[levelIndex] = score;
  }

  // Mở khoá level tiếp theo (nếu chưa mở)
  const nextLevelIndex = levelIndex + 1;
  let nextLevelUnlocked = false;
  if (nextLevelIndex > data.unlockedLevel) {
    data.unlockedLevel = nextLevelIndex;
    nextLevelUnlocked = true;
  }

  saveGameData(data);

  return {
    isNewHighScore,
    nextLevelUnlocked,
    highScore: Math.max(score, currentHighScore),
  };
}

/**
 * Xóa dữ liệu tiến trình game (tiện lợi cho việc reset/test)
 */
export function resetSaveData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[SaveSystem] Không thể xóa dữ liệu từ localStorage:', error);
  }
}
