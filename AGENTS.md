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
6. Quy tắc thiết kế map / độ cao: Quả bóng thường (dạng nhỏ) nhảy cao tối đa 4 ô trên cạn
   (v = 320px/s, g = 750px/s^2, h ≈ 65.6px / ~4.1 ô). Bậc thang hoặc vật cản mà bóng nhỏ
   cần nhảy lên có thể cao tối đa 3-4 ô.
7. Web Audio chỉ khởi tạo sau lần bấm phím đầu tiên (tránh vi phạm autoplay policy của trình duyệt).
8. Mọi thao tác đọc/ghi localStorage phải được bọc trong block try/catch để tránh crash khi ở chế độ ẩn danh hoặc bị chặn cookie/storage.
9. Bắt buộc chạy `npm run build` thành công trước khi báo hoàn thành mỗi task.
10. Quy định Git: Mọi thay đổi (sau khi người dùng kiểm tra test đạt yêu cầu) CHỈ ĐƯỢC COMMIT ở local, TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý PUSH lên GitHub. Chỉ thực hiện `git push` khi có lệnh rõ ràng từ người dùng.
11. Quy tắc nước ('~'): Quả bóng thường (dạng nhỏ) khi ở dưới nước và tiếp sàn được phép nhảy lên cao 2 ô (v_water = 96px/s, g_water = 130px/s^2, h ≈ 34.6px / ~2.1 ô) để vượt bục dưới nước hoặc nhảy lên bờ ao. Bóng to ở dưới nước tự động nổi lên (buoyancy) như phao bơi. Có thể đặt ô bơm phồng ('I') ở dưới nước để bóng phồng to và tự nổi lên bờ.
12. Quy tắc bệ biến hình ('I', 'D'): Bệ bơm phồng ('I') và bệ xì xẹp ('D') có tính chất vật lý như gạch kiên cố (bóng có thể đứng lên, nhảy từ trên bệ và bị cản ở các cạnh như gạch). Khi bóng chạm vào bất kỳ mặt nào của bệ sẽ kích hoạt biến hình tương ứng (I: nhỏ -> to; D: to -> nhỏ).


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

