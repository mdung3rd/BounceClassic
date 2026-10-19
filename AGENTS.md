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
scenes/ <- BootScene, MenuScene, GameScene...
objects/ <- Ball, Ring, Spike, Checkpoint, Exit...
levels/ <- level dạng mảng ký tự
public/assets/

## Điều khiển

- Trái/Phải: Phím mũi tên trái/phải hoặc A/D
- Nhảy: Space, W hoặc Phím mũi tên lên
- Chơi lại màn: Phím R
- Tạm dừng: Phím P hoặc Esc

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
- Nếu yêu cầu mâu thuẫn với file này thì hỏi lại tôi trước khi làm
- Không đụng vào file không liên quan đến task

## Tiến độ (cập nhật cuối mỗi task)

- [x] Prompt 0: Setup
- [x] Prompt 1: Quả bóng nảy
- [x] Prompt 2: Tilemap + va chạm
- [x] Prompt 3: Đối tượng chơi
- [x] Prompt 4: Phồng/xẹp, nước, kẻ địch, thanh nảy
- [ ] Prompt 5: Tạm dừng + phím tắt + màn hình hướng dẫn điều khiển
- [ ] Prompt 6: Menu, âm thanh, thêm level
- [ ] Prompt 7: Hoàn thiện
