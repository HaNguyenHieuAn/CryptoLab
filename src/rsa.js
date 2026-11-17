(() => {
  "use strict";

  const lab = globalThis.CryptoLab ??= {};
  const { encodeText, decodeText } = lab.bytes;
  const maxPrime = 1000000000n;
  const maxTextBytes = 512;

  function decimal(value, label) {
    const cleaned = String(value).trim();
    if (!/^\d{1,20}$/.test(cleaned)) {
      throw new Error(label + " cần là số nguyên thập phân không âm, tối đa 20 chữ số.");
    }
    return BigInt(cleaned);
  }

  function isPrime(number) {
    if (number < 2n) return false;
    if (number % 2n === 0n) return number === 2n;
    for (let factor = 3n; factor * factor <= number; factor += 2n) {
      if (number % factor === 0n) return false;
    }
    return true;
  }

  function extendedGcd(first, second) {
    let [a, b] = [first, second];
    let [x, nextX] = [1n, 0n];
    const steps = [];
    while (b !== 0n) {
      const quotient = a / b;
      const remainder = a % b;
      steps.push({ a, b, quotient, remainder });
      [a, b] = [b, remainder];
      [x, nextX] = [nextX, x - quotient * nextX];
    }
    return { gcd: a, coefficient: x, steps };
  }

  function makeKeys(rawP, rawQ, rawE) {
    const p = decimal(rawP, "p");
    const q = decimal(rawQ, "q");
    const e = decimal(rawE, "e");
    if (p > maxPrime || q > maxPrime) throw new Error("p và q tối đa bằng 1.000.000.000.");
    if (!isPrime(p) || !isPrime(q)) throw new Error("p và q phải là hai số nguyên tố.");
    if (p === q) throw new Error("p và q phải khác nhau.");

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    if (e <= 1n || e >= phi) throw new Error("e phải thỏa 1 < e < φ(n) = " + phi + ".");
    const derivation = extendedGcd(e, phi);
    if (derivation.gcd !== 1n) throw new Error("e và φ(n) phải nguyên tố cùng nhau (gcd = 1).");
    const d = (derivation.coefficient % phi + phi) % phi;
    return { p, q, n, phi, e, d, derivation, publicKey: [n, e], privateKey: [n, d] };
  }

  function powMod(value, exponent, modulus, steps) {
    let base = value % modulus;
    let result = 1n;
    // Mỗi lượt xử lý một bit từ phải sang trái và giảm modulo ngay.
    for (let exp = exponent; exp > 0n; exp >>= 1n) {
      const bit = exp & 1n;
      if (bit) result = result * base % modulus;
      steps?.push({ bit, base, result });
      base = base * base % modulus;
    }
    return result;
  }

  function run(source, keys, format, direction) {
    const { n, e, d } = keys;
    if (!["integer", "text"].includes(format) || !["encrypt", "decrypt"].includes(direction)) {
      throw new Error("Hãy chọn định dạng và thao tác RSA hợp lệ.");
    }
    const encrypting = direction === "encrypt";
    const exponent = encrypting ? e : d;
    let parts;
    if (format === "integer") {
      parts = [decimal(source, encrypting ? "Bản rõ m" : "Bản mã c")];
    } else {
      if (n <= 255n) throw new Error("Chế độ UTF-8 cần n > 255 để biểu diễn mọi byte.");
      if (!source.length || (!encrypting && !source.trim())) {
        throw new Error("Hãy nhập thông điệp UTF-8 hoặc dãy số bản mã.");
      }
      if (encrypting) {
        const bytes = encodeText(source);
        if (bytes.length > maxTextBytes) throw new Error("Thông điệp RSA tối đa 512 byte UTF-8.");
        parts = Array.from(bytes, byte => BigInt(byte));
      } else {
        const tokens = source.trim().split(/[\s,]+/);
        if (tokens.length > maxTextBytes) throw new Error("Bản mã RSA tối đa 512 số.");
        parts = tokens.map(token => decimal(token, "Mỗi phần tử bản mã"));
      }
    }
    if (parts.some(value => value >= n)) throw new Error("Mỗi giá trị RSA cần thuộc khoảng từ 0 đến " + (n - 1n) + ".");
    const values = parts.map(input => ({ input, output: powMod(input, exponent, n) }));
    const output = values.map(value => value.output);
    let display = output.join(" ");
    if (format === "text" && !encrypting) {
      if (output.some(value => value > 255n)) {
        throw new Error("Kết quả có giá trị ngoài khoảng byte 0–255. Hãy kiểm tra bản mã và cặp khóa.");
      }
      try {
        display = decodeText(Uint8Array.from(output, Number));
      } catch {
        throw new Error("Kết quả không tạo thành văn bản UTF-8 hợp lệ. Hãy kiểm tra bản mã và cặp khóa.");
      }
    }
    return { values, display, exponent, n };
  }

  lab.rsa = { makeKeys, powMod, run };
})();
