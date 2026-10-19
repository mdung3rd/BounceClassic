// src/levels/level1.ts
import { parseLevel } from './types';

/**
 * Bản đồ Level 1 chuẩn hóa vật lý và căn chỉnh pixel chuẩn xác:
 *
 * 1. Khe hẹp 1 ô (x=6..8, y=16): Quả bóng nhỏ (bán kính 6, đường kính 12px) dễ dàng chui qua.
 * 2. Ô Bơm phồng 'I' (x=10, y=16): Chạm vào biến thành bóng phồng (bán kính 11, đường kính 22px).
 *    Nếu thử quay đầu chui lại khe hẹp 1 ô -> bóng to 22px KHÔNG CHUI VỪA (bị chặn bởi tường gạch).
 * 3. Ring cao 1 'R' (x=16, y=11): Treo ở độ cao 5 ô. Bóng nhỏ nảy tối đa ~3.26 ô KHÔNG THỂ
 *    chạm tới. Chỉ có bóng phồng nhẹ nảy cao mới nhảy tới thu thập được!
 * 4. Ô Xì xẹp 'D' (x=17, y=16): Phải xì xẹp về bóng nhỏ thì mới chui qua tiếp khe hẹp thứ hai (x=21..23).
 * 5. Checkpoint 'C' (x=24, y=16): Điểm lưu vị trí hồi sinh an toàn trước khi vào hồ nước.
 * 6. Hồ nước trũng sâu '~' (x=30..35, y=17..18):
 *    - CHỖ ĐỰNG AO CHUẨN NƯỚC TRONG GẠCH: Thành ao bên trái là gạch '#' (cột 29), thành ao bên phải
 *      là gạch '#' (cột 36), đáy ao là gạch '#' (hàng 19).
 *    - Mặt nước nằm chìm đúng trong lòng ao ở hàng 17, đáy ao hàng 18 có Ring 2 chìm sâu (x=33)
 *      và bậc thềm chìm ở cột 35 (hàng 18) giúp bóng nhảy từng nấc 1 ô (16px) để lên bờ.
 *    - Hàng 16 phía trên ao hoàn toàn là không khí '.', không một pixel nước nào nhô lên giữa trời!
 *    - Bóng phồng trong nước tự động nổi bồng bềnh như phao bơi, người chơi chỉ cần lái Trái/Phải.
 * 7. Kẻ địch gai xoay 'M' (x=41, y=16): Tuần tra qua lại trong hành lang (x=39..43) có tường chặn 2 đầu.
 *    Trên đầu có Ring 3 'R' (x=41, y=12). Bóng chạm vào kẻ địch sẽ mất 1 mạng.
 * 8. Thanh nảy '^' (x=47, y=16): Đặt trước bức tường cao (x=49..50, cao 7 ô). Chạm từ trên xuống sẽ
 *    được phóng vút lên không trung, ăn Ring 4 (x=49, y=7) và bay qua tường.
 * 9. Cổng thoát 'E' (x=55, y=16): Mở khi ăn đủ cả 4 ring.
 *
 * Kích thước: 60 cột x 20 hàng (960px x 320px). Toàn bộ cột được căn thẳng hàng 100%.
 */
export const LEVEL_1_RAW: string[] = [
  // 0         1         2         3         4         5
  // 012345678901234567890123456789012345678901234567890123456789
  '############################################################', // 0: Trần đỉnh
  '#..........................................................#', // 1
  '#..........................................................#', // 2
  '#..........................................................#', // 3
  '#..........................................................#', // 4
  '#..........................................................#', // 5
  '#..........................................................#', // 6
  '#...............................................R..........#', // 7: Ring 4 (trên thanh nảy)
  '#..........................................................#', // 8
  '#..........................................................#', // 9
  '#...............................................##.........#', // 10: Tường cao
  '#................R..............................##.........#', // 11: Ring 1 (Ring cao cần bóng phồng)
  '#........................................R......##.........#', // 12: Ring 3 (trên kẻ địch gai xoay)
  '#...............................................##.........#', // 13: Tường cao
  '#.....###............###........................##.........#', // 14: Trần khe 1 & khe 2
  '#.....###............###..............#.....#...##.........#', // 15: Tường chặn kẻ địch ở 38 & 44
  '#..P......I......D......C.............#..M..#.^.##....E....#', // 16: Đường đi phẳng: P(3), Khe 1, I(10), D(17), Khe 2, C(24), ao nước (30..35) mặt thoáng, M(41)
  '##############################~~~~~~########################', // 17: Mặt sàn bằng phẳng với MẶT NƯỚC AO (30..35)
  '##############################~~R~I~########################', // 18: Lòng ao chìm: Ring 2 (32), Bơm phồng 'I' (34) giúp bóng to nổi lên
  '############################################################', // 19: Nền móng đáy ao & đáy thế giới vững chắc
];

export const LEVEL_1 = parseLevel(LEVEL_1_RAW);
