# Hướng dẫn sử dụng Phòng thí nghiệm mã hóa

Bản thực hành tiếng Việt về Playfair, RSA, DES và AES.

## Khởi chạy

- **Bản mã nguồn.** Mở `index.html` bằng Chrome, Edge hoặc Firefox phiên bản mới và bật JavaScript. Giữ nguyên các thư mục `src/` và `assets/` bên cạnh tệp này.
- **Bản HTML độc lập.** Chạy lệnh đóng gói ở cuối hướng dẫn, sau đó mở `dist/CryptoLab.html`. Có thể dùng tệp HTML đã tạo khi ngắt mạng.
- Nếu máy tính dùng chính sách chặn mở tệp HTML cục bộ và đã có Python 3, mở terminal trong thư mục `CryptoLab/` và chạy `python -m http.server 8000 --bind 127.0.0.1` hoặc `python3 -m http.server 8000 --bind 127.0.0.1`. Mở `http://127.0.0.1:8000/`. Nhấn **Ctrl+C** trong terminal để dừng máy chủ.

Chọn thuật toán ở thanh điều hướng. Nút **Dùng ví dụ** nạp tham số mẫu và chạy mã hóa. Nút **Dùng để giải mã** điền bản mã vừa tính và chuyển thao tác. Bấm nút **Giải mã** màu xanh để tính kết quả. Nút **Sao chép** lấy chuỗi kết quả.

## Playfair

1. Chọn **Playfair → Mã hóa**. Nhập khóa `PLAYFAIR EXAMPLE` và bản rõ `Hide the gold in the tree stump`.
2. Bấm **Mã hóa** và đối chiếu bản mã `BMODZBXDNABEKUDMUIXMMOUVIF`.
3. Chọn từng cặp dưới ma trận hoặc dùng các nút mũi tên. Màu xanh chanh biểu thị cặp vào, màu xanh ngọc biểu thị cặp ra. Mở **Chuẩn hóa và chia cặp** để xem chuỗi đã chuẩn hóa, khóa bỏ trùng và các cặp.
4. Chuyển kết quả sang **Giải mã** và chạy. Kết quả `HIDETHEGOLDINTHETREXESTUMP` giữ chữ X đã chèn. Khi đọc bản rõ, tự đối chiếu các vị trí có chữ đệm.

Bản rõ và khóa được chuyển sang chữ Latin in hoa sau khi bỏ dấu, đổi Đ thành D và dùng I cho J. Playfair ghép từng cặp và chèn X khi gặp hai chữ trùng trong cùng cặp hoặc thiếu chữ cuối. Khi chữ cần đệm là X, chương trình dùng Q. Bản mã cần có số chữ chẵn, dùng A–Z với I thay cho J. Có thể dùng khoảng trắng để nhóm bản mã.

## RSA

1. Chọn **RSA**, nhập `p = 61`, `q = 53`, `e = 17` và bấm **Tạo cặp khóa**. Kiểm tra khóa công khai `(3233, 17)` và khóa bí mật `(3233, 2753)`.
2. Chọn **Số nguyên**, nhập `65` và bấm **Mã hóa** để nhận `2790`. Dùng kết quả để chạy **Giải mã** và đối chiếu `65`.
3. Chọn **Văn bản UTF-8** để thử tiếng Việt. Khi mã hóa, mỗi byte sinh một số bản mã. Khi giải mã, nhập dãy số tách bằng dấu cách hoặc dấu phẩy. Có thể chọn từng phần tử để xem các bước bình phương và nhân.
4. Sửa p, q hoặc e thì bấm **Tạo cặp khóa** lại. Mở **Các bước Euclid mở rộng** để xem các phép chia dùng để tính số mũ bí mật.

p và q phải là hai số nguyên tố khác nhau, tối đa 1.000.000.000. e thỏa `1 < e < φ(n)` và `gcd(e, φ(n)) = 1`. Giá trị đem mã hóa hoặc giải mã phải nhỏ hơn n. Chế độ UTF-8 cần `n > 255` và giới hạn 512 byte bản rõ hoặc 512 số bản mã. RSA trong ứng dụng dùng phép toán số học thuần phục vụ minh họa.

## DES và AES

1. Chọn **DES** hoặc **AES**, rồi chọn **ECB** hoặc **CBC**. Với AES, chọn thêm cỡ khóa 128, 192 hoặc 256 bit.
2. Chọn định dạng khóa **Hex** hoặc **Văn bản UTF-8**. Dùng đúng số byte theo bảng.
3. Chọn **PKCS#7** để xử lý dữ liệu có độ dài bất kỳ trong giới hạn 8.192 byte. Chọn **Không đệm** để đối chiếu vector mẫu và nhập số byte là bội dương của kích thước khối.
4. Mã hóa CBC bằng IV ngẫu nhiên mới. Để trống ô IV để ứng dụng tự tạo, hoặc bấm **Tạo IV**. Giữ IV xuất hiện dưới kết quả để giải mã. Ví dụ có IV cố định để phép thử lặp lại đúng.
5. Nhập bản rõ **Hex** hoặc **UTF-8**, rồi chạy **Mã hóa**. Bản mã luôn hiển thị dạng Hex. Khi giải mã, cần cùng thuật toán, khóa, chế độ, cách đệm và IV nếu là CBC. Chọn **Hex** hoặc **UTF-8** để đọc bản rõ.
6. Trong **Phân tích khối**, chọn khối và vòng. DES hiển thị khóa con và các giá trị của hàm Feistel. AES hiển thị ma trận trạng thái khi chọn từng phép biến đổi. CBC cho thấy dữ liệu nối từ IV hoặc từ khối mã trước.

| Thuật toán | Khối | Khóa nhập | IV khi dùng CBC |
| --- | ---: | ---: | ---: |
| DES | 8 byte | 8 byte / 16 ký tự Hex | 8 byte / 16 ký tự Hex |
| AES-128 | 16 byte | 16 byte / 32 ký tự Hex | 16 byte / 32 ký tự Hex |
| AES-192 | 16 byte | 24 byte / 48 ký tự Hex | 16 byte / 32 ký tự Hex |
| AES-256 | 16 byte | 32 byte / 64 ký tự Hex | 16 byte / 32 ký tự Hex |

DES dùng 56 bit khóa hiệu dụng. Mỗi byte Hex cần hai ký tự `0–9` hoặc `A–F`; có thể chèn khoảng trắng giữa các nhóm. Số byte UTF-8 của chữ có dấu thường lớn hơn số ký tự. Nếu bản rõ giải mã chứa byte ngoài định dạng UTF-8 hợp lệ, giao diện hiển thị Hex.

- **Mẫu DES.** ECB, không đệm, khóa `133457799BBCDFF1`, bản rõ `0123456789ABCDEF`. Bản mã mong đợi `85E813540F0AB405`.
- **Mẫu AES.** AES-128 CBC, không đệm, khóa `2B7E151628AED2A6ABF7158809CF4F3C`, IV `000102030405060708090A0B0C0D0E0F`. Bấm **Dùng ví dụ** để nạp hai khối. Bản mã mong đợi ở khối 1 là `7649ABAC8119B246CEE98E9B12E9197D` và ở khối 2 là `5086CB9B507219EE95DB113A917678B2`.

## Chạy lại kiểm thử và đóng gói

Cài Node.js 20 trở lên nếu cần chạy kiểm thử hoặc tạo lại bản HTML độc lập. Mở terminal trong thư mục `CryptoLab/` rồi chạy từng lệnh.

```sh
node --test tests/algorithms.test.cjs
node tools/build.mjs
```

Kết quả đóng gói nằm tại `dist/CryptoLab.html`. Ứng dụng chạy trực tiếp trong trình duyệt. Node.js chỉ dùng cho hai lệnh trên.

## Phạm vi sử dụng

Sử dụng dữ liệu mẫu khi thực hành. Playfair, DES, RSA số học thuần và các chế độ ECB/CBC trong mô phỏng phục vụ quan sát thuật toán. Ứng dụng hiển thị khóa và giá trị trung gian trên màn hình, còn tính xác thực dữ liệu nằm ngoài phạm vi thực hành này.
