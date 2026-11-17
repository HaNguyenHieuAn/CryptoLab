(() => {
  "use strict";

  const lab = globalThis.CryptoLab ??= {};
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

  function fromHex(value, label = "Dữ liệu Hex") {
    const hex = value.replace(/\s/g, "");
    if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
      throw new Error(label + " cần có hai ký tự 0–9 hoặc A–F cho mỗi byte.");
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  function toHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function encodeText(value) {
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
      throw new Error("Văn bản chứa ký tự Unicode chưa hoàn chỉnh.");
    }
    return encoder.encode(value);
  }

  function decodeText(bytes) {
    return decoder.decode(bytes);
  }

  function xor(left, right) {
    return left.map((byte, index) => byte ^ right[index]);
  }

  function pad(bytes, blockSize) {
    const count = blockSize - bytes.length % blockSize;
    const result = new Uint8Array(bytes.length + count);
    result.set(bytes);
    result.fill(count, bytes.length);
    return result;
  }

  function unpad(bytes, blockSize) {
    const count = bytes[bytes.length - 1];
    if (!(count >= 1 && count <= blockSize) ||
        !bytes.subarray(bytes.length - count).every(byte => byte === count)) {
      throw new Error("Đệm PKCS#7 không hợp lệ. Hãy kiểm tra khóa, chế độ, IV và bản mã.");
    }
    return bytes.slice(0, bytes.length - count);
  }

  function randomBytes(size) {
    if (!globalThis.crypto?.getRandomValues) {
      throw new Error("Trình duyệt không tạo được IV ngẫu nhiên. Hãy nhập IV dạng Hex.");
    }
    return globalThis.crypto.getRandomValues(new Uint8Array(size));
  }

  lab.bytes = { fromHex, toHex, encodeText, decodeText, xor, pad, unpad, randomBytes };
})();
