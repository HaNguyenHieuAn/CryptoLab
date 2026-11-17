# CryptoLab · Phòng thí nghiệm mã hóa

CryptoLab là ứng dụng tiếng Việt mô phỏng mã hóa và giải mã Playfair, RSA, DES và AES. Người học có thể thay đổi đầu vào, đối chiếu kết quả với mẫu và xem các giá trị được tính ở từng bước.

Đồ án học phần **An toàn mạng máy tính (NT101.R11)**, Trường Đại học Công nghệ Thông tin, ĐHQG-HCM.

| Thành viên | MSSV |
| --- | --- |
| Hà Nguyễn Hiếu An | 24520043 |
| Nguyễn Hữu Nghĩa | 24521144 |

## Chức năng

| Thuật toán | Thao tác và dữ liệu minh họa |
| --- | --- |
| **Playfair** | Chuẩn hóa văn bản, tạo ma trận khóa 5 × 5, ghép cặp và chỉ ra quy tắc biến đổi của từng cặp khi mã hóa hoặc giải mã. |
| **RSA** | Tạo cặp khóa từ `p`, `q`, `e`. Dùng khóa công khai `(n, e)` để mã hóa và khóa bí mật `(n, d)` để giải mã. Hiển thị các bước Euclid mở rộng và lũy thừa modulo trên số nguyên hoặc từng byte UTF-8. |
| **DES** | Mã hóa và giải mã theo khối 64 bit. Hiển thị khóa con, phép mở rộng, kết quả S-box và hai nửa trạng thái trong các vòng Feistel. |
| **AES** | Mã hóa và giải mã với khóa 128, 192 hoặc 256 bit. Hiển thị ma trận trạng thái 4 × 4 byte theo từng phép biến đổi của mỗi vòng. |

DES và AES hỗ trợ **ECB**, **CBC**, đệm **PKCS#7** và tùy chọn **Không đệm**. Khóa và bản rõ có thể nhập dạng Hex hoặc UTF-8. Với CBC, cần dùng lại IV của lần mã hóa khi giải mã.

## Khởi chạy

1. Tải và giải nén mã nguồn hoặc clone repository về máy.
2. Mở `index.html` bằng Chrome, Edge hoặc Firefox phiên bản mới. Giữ nguyên các thư mục `assets/` và `src/` bên cạnh tệp.

Ứng dụng chạy trực tiếp trong trình duyệt bằng HTML, CSS và JavaScript thuần. Nếu máy chặn mở tệp HTML cục bộ, chạy lệnh dưới đây trong thư mục dự án với Python 3. Trên Windows, có thể thay `python3` bằng `py` nếu đã cài Python Launcher.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Mở <http://127.0.0.1:8000/>. Nhấn **Ctrl+C** ở terminal để dừng.

## Chạy thử trên giao diện

1. Chọn một thuật toán ở thanh điều hướng, rồi bấm **Dùng ví dụ** để nạp dữ liệu và chạy mã hóa.
2. Đối chiếu bản mã với bảng dưới đây. Chọn cặp chữ, phần tử, khối hoặc vòng để xem giá trị trung gian.
3. Bấm **Dùng để giải mã**, sau đó bấm **Giải mã** để kiểm tra dữ liệu khôi phục.

| Thuật toán | Mẫu có sẵn | Bản mã mong đợi |
| --- | --- | --- |
| Playfair | Khóa `PLAYFAIR EXAMPLE`, bản rõ `Hide the gold in the tree stump` | `BMODZBXDNABEKUDMUIXMMOUVIF` |
| RSA | `p = 61`, `q = 53`, `e = 17`, bản rõ `65` | `2790` |
| DES | ECB, không đệm, khóa `133457799BBCDFF1`, bản rõ `0123456789ABCDEF` | `85E813540F0AB405` |
| AES | AES-128 CBC, không đệm, khóa `2B7E151628AED2A6ABF7158809CF4F3C`, IV `000102030405060708090A0B0C0D0E0F` | Khối 1 `7649ABAC8119B246CEE98E9B12E9197D`<br>Khối 2 `5086CB9B507219EE95DB113A917678B2` |

Khi giải mã mẫu Playfair, kết quả là `HIDETHEGOLDINTHETREXESTUMP` theo quy ước chuẩn hóa và giữ ký tự đệm. Xem cách nhập dữ liệu và các giới hạn của từng thuật toán trong [Hướng dẫn sử dụng](HUONG_DAN_SU_DUNG.md).

## Kiểm thử và tạo bản HTML độc lập

Dùng **Node.js 20 trở lên** và chạy các lệnh sau từ thư mục chứa `index.html`.

```sh
node --test tests/algorithms.test.cjs
node tools/build.mjs
```

- Lệnh đầu chạy 38 ca kiểm thử, bao gồm vector đối chiếu, giải mã ngược, trạng thái trung gian và dữ liệu sai định dạng.
- Lệnh thứ hai tạo `dist/CryptoLab.html`. Mở tệp này trong trình duyệt để dùng bản gộp CSS và JavaScript.

## Cấu trúc mã nguồn

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html`, `assets/lab.css` | Bố cục giao diện và định dạng hiển thị. |
| `src/playfair.js`, `src/rsa.js`, `src/des.js`, `src/aes.js` | Xử lý thuật toán và ghi lại các bước tính toán. |
| `src/blocks.js`, `src/bytes.js` | Xử lý ECB/CBC, chuyển đổi Hex/UTF-8, XOR và đệm PKCS#7. |
| `src/ui-*.js`, `src/main.js` | Đọc biểu mẫu, điều hướng và hiển thị kết quả. |
| `tests/algorithms.test.cjs` | Kiểm thử lõi thuật toán và dữ liệu biên. |
| `tools/build.mjs` | Tạo tệp HTML chạy độc lập. |

Mô phỏng phục vụ học tập với dữ liệu mẫu. Khóa và trạng thái trung gian được hiển thị trực tiếp để người học đối chiếu.

## Đưa lên GitHub

1. Tạo một repository trống trên GitHub. Gói mã nguồn đã có `README.md` và `.gitignore`.
2. Mở PowerShell hoặc Git Bash trong thư mục `CryptoLab/` vừa giải nén. Chạy các lệnh dưới đây sau khi thay `TEN_TAI_KHOAN` và `TEN_REPO` trong URL bằng thông tin của repository.

```sh
git init -b main
git add .
git status --short
git commit -m "Khoi tao du an CryptoLab"
git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPO.git
git push -u origin main
```

Repository sẽ hiển thị README từ thư mục gốc. Khi GitHub yêu cầu đăng nhập hoặc xác thực, làm theo hướng dẫn của Git trên máy. [Tài liệu GitHub về đưa mã nguồn có sẵn lên repository](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
