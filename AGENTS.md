# AGENTS.md: Luật chung cho dự án Bounce Test

## Tổng quan

Web game desktop clone "Bounce Classic" (bản Nokia) để test cá nhân, không phát hành.
Quả bóng đỏ lăn trên sàn, chỉ nhảy khi bấm phím (chuẩn Nokia); thu hết ring để mở cổng thoát.

## Tech stack

- Phaser 3 + TypeScript + Vite
- Web game desktop, điều khiển bàn phím, deploy GitHub + Netlify
- Chỉ dùng npm, không thêm thư viện mới nếu chưa hỏi tôi

## Thông số game

- Độ phân giải logic: 480x320 (landscape ngang), Scale.FIT, căn giữa
- pixelArt: true, roundPixels: true
- Tile 16x16px (màn hình = 30x20 ô)

## Cấu trúc thư mục

src/
config/physics.ts <- MỌI hằng số vật lý
audio/ <- AudioManager.ts (Web Audio chiptune synth, singleton, phím N mute)
scenes/ <- HelpScene, MenuScene, LevelSelectScene, GameScene...
objects/ <- Ball, Ring, Spike, Checkpoint, Exit, HUD, ObjectManager...
levels/ <- types.ts, level1.ts, index.ts (export mảng LEVELS)...
utils/ <- save.ts (lưu trữ localStorage bọc try/catch)...
public/assets/

## Điều khiển

- Trái/Phải: Phím mũi tên trái/phải hoặc A/D
- Nhảy: Space, W hoặc Phím mũi tên lên
- Chơi lại màn: Phím R
- Tạm dừng: Phím P hoặc Esc (khi đang chơi)
- Về Menu chính: Phím M (hoạt động khi đang chơi, tạm dừng, game over hoặc level complete)
- Bật/tắt âm thanh (Mute): Phím N (hoạt động ở mọi màn hình, có icon loa nhỏ)
- Điều hướng Menu / Chọn Level: Mũi tên (hoặc WASD), Enter / Space để chọn, Esc để quay lại Menu
- Thắng màn (Level Complete): Enter để sang level kế (hoặc về menu nếu là level cuối), R để chơi lại màn

## Luật BẮT BUỘC

1. KHÔNG dùng Arcade Physics hay Matter cho quả bóng. Tự viết chuyển động và
   va chạm với tile: gravity cố định, nhảy theo phím bấm (hoặc nảy khi chạm spring),
   fixed timestep 60Hz (accumulator trong update).
2. Va chạm tile: xử lý tách riêng trục X rồi trục Y. Không để bóng xuyên gạch
   hoặc kẹt ở góc.
3. Mọi hằng số vật lý (gravity, bounceVelocity, jumpVelocity, moveSpeed,
   bán kính...) chỉ nằm trong src/config/physics.ts. Không hardcode số vật lý
   ở nơi khác.
4. Chưa có asset thì vẽ placeholder bằng Graphics/RenderTexture. Không tải
   ảnh hay âm thanh từ internet.
5. Mỗi loại đối tượng game là một class riêng trong src/objects.
6. Quy tắc thiết kế map / độ cao: Bóng nhảy cao tối đa h = v^2 / (2*g) ≈ 52.3px
   (tương đương ~3.26 ô 16px). MỌI bậc thang hoặc vật cản mà bóng cần nhảy lên
   chỉ được cao tối đa 2 ô (32px), tuyệt đối không thiết kế bậc cao 3-4 ô vì bóng
   sẽ bị hụt mép và không thể trèo lên được.
7. Web Audio chỉ khởi tạo sau lần bấm phím đầu tiên (tránh vi phạm autoplay policy của trình duyệt).
8. Mọi thao tác đọc/ghi localStorage phải được bọc trong block try/catch để tránh crash khi ở chế độ ẩn danh hoặc bị chặn cookie/storage.
9. Bắt buộc chạy `npm run build` thành công trước khi báo hoàn thành mỗi task.
10. Quy định Git: Mọi thay đổi (sau khi người dùng kiểm tra test đạt yêu cầu) CHỈ ĐƯỢC COMMIT ở local, TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý PUSH lên GitHub. Chỉ thực hiện `git push` khi có lệnh rõ ràng từ người dùng.
11. Quy tắc nước ('~'): KHÔNG ĐƯỢC thêm cơ chế nhảy ở dưới nước. Quả bóng ở dưới nước chỉ có thể di chuyển sang trái hoặc phải. Bóng to ở dưới nước thì auto nổi, còn bóng nhỏ thì auto chìm. Chỉ được thêm ô bơm phồng ('I') ở dưới nước để bóng phồng to và nổi lên bờ ao.


## Ký hiệu level (mảng ký tự)

'#' gạch | '.' trống | 'P' điểm xuất phát | 'R' ring | 'S' gai
'E' cổng thoát | 'C' checkpoint | '~' nước | 'I' bơm phồng
'D' xì xẹp | '^' thanh nảy | 'M' kẻ địch gai xoay
(Khi thêm ký hiệu mới thì cập nhật bảng này.)

## Quy ước code

- TypeScript strict, không dùng `any` nếu tránh được
- Comment tiếng Việt ở chỗ logic quan trọng (vật lý, va chạm)
- Tên biến/hàm/class bằng tiếng Anh
- Mỗi lần chỉ làm đúng việc tôi yêu cầu, không tự ý refactor hay thêm tính năng

## Cách làm việc

- Làm xong phải chạy `npm run build` để chắc chắn không lỗi type
- Cuối mỗi task: báo ngắn gọn đã sửa/tạo file nào và cách test
- Quy định Git: Chỉ commit local (khi test xong), tuyệt đối không tự ý push lên GitHub nếu chưa có lệnh của tôi
- Nếu yêu cầu mâu thuẫn với file này thì hỏi lại tôi trước khi làm
- Không đụng vào file không liên quan đến task

## Tiến độ (cập nhật cuối mỗi task)

- [x] Prompt 0: Setup
- [x] Prompt 1: Quả bóng nảy
- [x] Prompt 2: Tilemap + va chạm
- [x] Prompt 3: Đối tượng chơi
- [x] Prompt 4: Phồng/xẹp, nước, kẻ địch, thanh nảy
- [x] Prompt 5: Tạm dừng + phím tắt + màn hình hướng dẫn điều khiển
- [x] Prompt 6: Menu chính, hệ thống chọn level, lưu tiến trình & điểm cao (save.ts), phím tắt M
- [x] Prompt 7A: Hệ thống âm thanh Web Audio (AudioManager.ts, chiptune synth, phím N, icon loa mute)
- [x] Prompt 7B: Thêm level mới (Level 2, Level 3, Level 4)
- [x] Prompt 8: Thiết kế lại Level 2, Level 3, Level 4 (không gian 2D nhiều tầng, hồ nước ngầm lớn, tháp lò xo, tool kiểm định tự động validateLevel.ts)
- [x] Prompt 9: Sửa triệt để 2 lỗi Level 2 (mở thông hầm ngầm, mặt nước ngang bằng mặt sàn), đồng bộ cơ chế bờ hồ ngang bằng cho Level 3 & Level 4 và Ball.ts
- [x] Prompt 10: Sửa Level 3 (thiết kế lại vị trí thanh lò xo xuất phát tiếp đất chuẩn xác vào C1, đóng kín buồng Cổng thoát E tránh gây hiểu nhầm)
- [x] Prompt 11: Đưa Cổng thoát E của Level 3 lên đích đến cuối cùng ở Tầng Thượng Thiên Đàng (hàng 6, cột 4), loại bỏ hoàn toàn khối gạch che chắn gây hiểu nhầm ở khu xuất phát
- [x] Prompt 12: Thiết kế lại Tháp Lò Xo Level 3 (nâng bệ phóng lò xo lên hàng 12 xóa bỏ hoàn toàn ống khói hẹp bị kẹt, mở cửa sổ trời rộng thông thoáng lên Tầng Thượng và Chòi Vọng Cảnh, thiết kế cầu thang 2 bậc hàng 14 & 16 leo lên bệ phóng cực kỳ dễ dàng)
- [x] Prompt 13: Xóa bỏ hố rỗng bẫy người chơi dưới Pháo Đài Level 4 (lấp đầy móng núi đá kiên cố từ hàng 7..32 cột 0..27, loại bỏ hoàn toàn khoảng không vô nghĩa gây kẹt bóng)
- [x] Prompt 14: Tinh chỉnh Level 2 & 3 (tăng độ thử thách với bẫy gai S, loại bỏ hoàn toàn các chi tiết thừa/hố rỗng/lò xo bị chặn, tối ưu bậc thang chuẩn 2 ô, kiểm định tự động 100% qua validateLevel.ts)
- [x] Prompt 15: Sửa triệt để 2 chỗ bất hợp lý Level 2 & 3 (mở thông sàn Tầng Thượng đưa Cổng thoát E ra vị trí thoáng không còn bị tường chặn; xóa bỏ hoàn toàn tảng đá nổi thừa trong lòng hồ, khắc phục lỗi render gợn sóng dưới gạch)
- [x] Prompt 16: Thiết kế lại Level 2, 3, 4 theo phong cách Parkour (chuỗi bục lơ lửng, leo bục ziczac, precision drops, timing né quái & bẫy gai xen kẽ, lò xo nhịp nhàng), giữ nguyên toàn bộ logic game, 100% vượt qua kiểm định validateLevel.ts và build thành công
