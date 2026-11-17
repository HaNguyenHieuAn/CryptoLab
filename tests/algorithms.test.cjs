"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
for (const moduleName of ["bytes", "playfair", "rsa", "des", "aes", "blocks"]) {
  require("../src/" + moduleName + ".js");
}
const { bytes, playfair, rsa, des, aes, blocks } = globalThis.CryptoLab;
const { fromHex, toHex, encodeText, decodeText, xor } = bytes;

const playfairKey = "PLAYFAIR EXAMPLE";
const playfairPlain = "Hide the gold in the tree stump";
const playfairCipher = "BMODZBXDNABEKUDMUIXMMOUVIF";
const textbook = rsa.makeKeys("61", "53", "17");
const desKey = fromHex("133457799BBCDFF1");
const desPlain = fromHex("0123456789ABCDEF");
const aesPlain = fromHex("00112233445566778899AABBCCDDEEFF");

test("Playfair đối chiếu ví dụ PLAYFAIR EXAMPLE", () => {
  const run = playfair.run(playfairPlain, playfairKey, "encrypt");
  assert.equal(run.matrix.letters.join(""), "PLAYFIREXMBCDGHKNOQSTUVWZ");
  assert.equal(run.output, playfairCipher);
  assert.equal(run.steps.length, 13);
  assert.deepEqual(run.steps.slice(0, 2).map(({ input, output, rule }) => [input, output, rule]),
    [["HI", "BM", "Hình chữ nhật"], ["DE", "OD", "Cùng cột"]]);
});

test("Playfair giải mã giữ phần chèn X", () => {
  const run = playfair.run(playfairCipher.toLowerCase().replace("be", " BE "), playfairKey, "decrypt");
  assert.equal(run.output, "HIDETHEGOLDINTHETREXESTUMP");
});

test("Playfair mã hóa và giải mã mọi cặp chữ khác nhau", () => {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  const rules = new Set();
  for (const a of alphabet) {
    for (const b of alphabet) {
      if (a === b) continue;
      const run = playfair.run(a + b, "MONARCHY", "encrypt");
      rules.add(run.steps[0].rule);
      assert.equal(playfair.run(run.output, "MONARCHY", "decrypt").output, a + b);
    }
  }
  assert.equal(rules.size, 3);
});

test("Playfair chuẩn hóa tiếng Việt, J và ký tự ngoài bảng", () => {
  assert.equal(playfair.normalize("Đồ án 42, J! 🙂"), "DOANI");
  assert.equal(playfair.makeMatrix("Jij").keyLetters.join(""), "I");
});

test("Playfair dùng Q khi cần đệm chữ X", () => {
  const run = playfair.run("XX", "MONARCHY", "encrypt");
  assert.equal(run.prepared, "XQXQ");
  assert.deepEqual(run.steps.map(step => step.filler), ["Q", "Q"]);
  assert.equal(playfair.run(run.output, "MONARCHY", "decrypt").output, "XQXQ");
});

test("Playfair giải mã được đầu ra lớn nhất do tách các chữ trùng", () => {
  const run = playfair.run("A".repeat(1200), "MONARCHY", "encrypt");
  assert.equal(run.output.length, 2400);
  assert.equal(playfair.run(run.output, "MONARCHY", "decrypt").output, "AX".repeat(1200));
});

test("Playfair từ chối khóa trống và bản mã sai", () => {
  assert.throws(() => playfair.run("HELLO", "123", "encrypt"), /chữ cái Latin/);
  assert.throws(() => playfair.run("abc", "MONARCHY", "decrypt"), /số chữ chẵn/);
  assert.throws(() => playfair.run("AJ", "MONARCHY", "decrypt"), /I thay cho J/);
  assert.throws(() => playfair.run("AA", "MONARCHY", "decrypt"), /giống nhau/);
  assert.throws(() => playfair.run("A!".repeat(4), "MONARCHY", "decrypt"), /chỉ dùng chữ/);
});

test("RSA sinh khóa và kiểm chứng ví dụ m=65", () => {
  assert.deepEqual(textbook.publicKey, [3233n, 17n]);
  assert.deepEqual(textbook.privateKey, [3233n, 2753n]);
  assert.equal(textbook.phi, 3120n);
  assert.equal(textbook.e * textbook.d % textbook.phi, 1n);
  assert.equal(rsa.run("65", textbook, "integer", "encrypt").display, "2790");
  assert.equal(rsa.run("2790", textbook, "integer", "decrypt").display, "65");
});

test("RSA đối chiếu BigInt với Python pow ngoài giới hạn Number", () => {
  const keys = rsa.makeKeys("999999937", "999999929", "65537");
  assert.equal(keys.n, 999999866000004473n);
  assert.equal(keys.d, 125806779051223553n);
  const message = "9007199254740997";
  const encrypted = rsa.run(message, keys, "integer", "encrypt").display;
  assert.equal(encrypted, "880568489092457049");
  assert.equal(rsa.run(encrypted, keys, "integer", "decrypt").display, message);
});

test("RSA xử lý 0, n−1 và các số không nguyên tố cùng nhau với n", () => {
  for (const value of [0n, 61n, 53n, textbook.n - 1n]) {
    const encrypted = rsa.run(String(value), textbook, "integer", "encrypt").display;
    assert.equal(rsa.run(encrypted, textbook, "integer", "decrypt").display, String(value));
  }
});

test("RSA hoàn nguyên văn bản UTF-8 kể cả dấu, khoảng trắng và emoji", () => {
  const text = "\uFEFF  Đồ án RSA 🔐\n";
  const encrypted = rsa.run(text, textbook, "text", "encrypt");
  assert.equal(encrypted.values.length, encodeText(text).length);
  assert.equal(rsa.run(encrypted.display.replaceAll(" ", ", "), textbook, "text", "decrypt").display, text);
});

test("RSA dấu vết bình phương và nhân khớp phép tính cuối", () => {
  const steps = [];
  assert.equal(rsa.powMod(65n, textbook.e, textbook.n, steps), 2790n);
  assert.deepEqual(steps.map(step => step.bit), [1n, 0n, 0n, 0n, 1n]);
  assert.equal(steps.at(-1).result, 2790n);
});

test("RSA xác thực p, q và e", () => {
  assert.throws(() => rsa.makeKeys("21", "53", "17"), /nguyên tố/);
  assert.throws(() => rsa.makeKeys("61", "61", "17"), /khác nhau/);
  assert.throws(() => rsa.makeKeys("61", "53", "3120"), /1 < e/);
  assert.throws(() => rsa.makeKeys("61", "53", "12"), /gcd = 1/);
  assert.throws(() => rsa.makeKeys("1000000007", "53", "17"), /tối đa/);
  assert.throws(() => rsa.makeKeys("61e2", "53", "17"), /thập phân/);
});

test("RSA xác thực khoảng giá trị và giới hạn UTF-8", () => {
  assert.throws(() => rsa.run("3233", textbook, "integer", "encrypt"), /3232/);
  assert.throws(() => rsa.run("-1", textbook, "integer", "decrypt"), /không âm/);
  assert.throws(() => rsa.run("A", rsa.makeKeys("3", "5", "3"), "text", "encrypt"), /n > 255/);
  assert.throws(() => rsa.run("á".repeat(257), textbook, "text", "encrypt"), /512 byte/);
});

test("RSA báo lỗi byte hoặc UTF-8 giải mã sai định dạng", () => {
  const ciphertext = plain => rsa.run(plain, textbook, "integer", "encrypt").display;
  assert.throws(() => rsa.run(ciphertext("256"), textbook, "text", "decrypt"), /0–255/);
  assert.throws(() => rsa.run(ciphertext("255"), textbook, "text", "decrypt"), /UTF-8 hợp lệ/);
});

test("DES đối chiếu vector một khối và giải mã ngược", () => {
  const cipher = des.makeCipher(desKey);
  const encrypted = cipher.transform(desPlain, false);
  assert.equal(toHex(encrypted), "85E813540F0AB405");
  assert.deepEqual(cipher.transform(encrypted, true), desPlain);
});

test("DES đối chiếu các giá trị trung gian trong vòng Feistel đầu tiên", () => {
  const steps = [];
  des.makeCipher(desKey).transform(desPlain, false, steps);
  assert.equal(steps[0].state, 0xCC00CCFFF0AAF0AAn);
  assert.equal(steps[1].subkey, 0x1B02EFFC7072n);
  assert.equal(steps[1].mixed, 0x6117BA866527n);
  assert.equal(steps[1].fOutput, 0x234AA9BBn);
  assert.equal(steps[1].right, 0xEF4A6544n);
  assert.equal(steps.at(-1).state, 0x85E813540F0AB405n);
});

test("DES giải mã dùng khóa con từ K16 đến K1", () => {
  const trace = [];
  des.makeCipher(desKey).transform(fromHex("85E813540F0AB405"), true, trace);
  assert.equal(trace[1].keyIndex, 16);
  assert.equal(trace[16].keyIndex, 1);
});

test("DES bỏ qua 8 bit chẵn lẻ khi sinh khóa con", () => {
  const alternative = desKey.map(byte => byte ^ 1);
  assert.deepEqual(des.makeCipher(alternative).transform(desPlain, false),
    des.makeCipher(desKey).transform(desPlain, false));
});

const desCbc = {
  algorithm: "des", key: desKey, iv: fromHex("0102030405060708"),
  input: fromHex("0123456789ABCDEFFEDCBA9876543210"), mode: "cbc", direction: "encrypt"
};
for (const [padding, expected] of [
  ["none", "E61690CC695580F6E7B5DBF7080FEF24"],
  ["pkcs7", "E61690CC695580F6E7B5DBF7080FEF24B4289B140AC9E684"]
]) {
  test("DES CBC " + padding + " khớp OpenSSL", () => {
    const encrypted = blocks.run({ ...desCbc, padding });
    assert.equal(toHex(encrypted.output), expected);
    const decrypted = blocks.run({ ...desCbc, padding, direction: "decrypt", input: encrypted.output });
    assert.deepEqual(decrypted.output, desCbc.input);
  });
}

const aesKnown = [
  ["000102030405060708090A0B0C0D0E0F", "69C4E0D86A7B0430D8CDB78070B4C55A", 10],
  ["000102030405060708090A0B0C0D0E0F1011121314151617", "DDA97CA4864CDFE06EAF70A0EC0D7191", 12],
  ["000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F", "8EA2B7CA516745BFEAFC49904B496089", 14]
];
for (const [key, expected, rounds] of aesKnown) {
  test("AES-" + key.length * 4 + " đối chiếu vector và giải mã ngược", () => {
    const cipher = aes.makeCipher(fromHex(key));
    const encrypted = cipher.transform(aesPlain, false);
    assert.equal(cipher.rounds, rounds);
    assert.equal(toHex(encrypted), expected);
    assert.deepEqual(cipher.transform(encrypted, true), aesPlain);
  });
}

test("AES đối chiếu từng biến đổi vòng 1 theo vector NIST", () => {
  const trace = [];
  aes.makeCipher(fromHex(aesKnown[0][0])).transform(aesPlain, false, trace);
  assert.deepEqual(trace.filter(step => step.round === 1).map(step => toHex(step.state)), [
    "63CAB7040953D051CD60E0E7BA70E18C", "6353E08C0960E104CD70B751BACAD0E7",
    "5F72641557F5BC92F7BE3B291DB9F91A", "89D810E8855ACE682D1843D8CB128FE4"
  ]);
  assert.deepEqual(trace.filter(step => step.round === 10).map(step => step.name),
    ["SubBytes", "ShiftRows", "AddRoundKey"]);
});

test("AES CBC khớp bốn khối NIST SP 800-38A", () => {
  const options = {
    algorithm: "aes", key: fromHex("2B7E151628AED2A6ABF7158809CF4F3C"),
    iv: fromHex("000102030405060708090A0B0C0D0E0F"), mode: "cbc", padding: "none"
  };
  const plain = fromHex("6BC1BEE22E409F96E93D7E117393172A AE2D8A571E03AC9C9EB76FAC45AF8E51 " +
    "30C81C46A35CE411E5FBC1191A0A52EF F69F2445DF4F9B17AD2B417BE66C3710");
  const expected = "7649ABAC8119B246CEE98E9B12E9197D5086CB9B507219EE95DB113A917678B2" +
    "73BED6B8E3C1743B7116E69E222295163FF1CAA1681FAC09120ECA307586E1A7";
  const encrypted = blocks.run({ ...options, input: plain, direction: "encrypt" });
  assert.equal(toHex(encrypted.output), expected);
  const recovered = blocks.run({ ...options, input: encrypted.output, direction: "decrypt" });
  assert.deepEqual(recovered.output, plain);
  assert.deepEqual(encrypted.blocks[1].primitiveInput, xor(plain.slice(16, 32), encrypted.output.slice(0, 16)));
  assert.deepEqual(recovered.blocks[1].output, xor(recovered.blocks[1].primitiveOutput, recovered.blocks[1].chain));
});

for (const mode of ["ecb", "cbc"]) {
  for (const size of [16, 24, 32]) {
    test("AES-" + size * 8 + " " + mode.toUpperCase() + " PKCS#7 khớp Node crypto", () => {
      const key = Uint8Array.from({ length: size }, (_, i) => 4 * i);
      const iv = mode === "cbc" ? new Uint8Array(16).fill(91) : null;
      const input = encodeText("Chào Ba Ngòi 🔐\nUTF-8");
      const options = { algorithm: "aes", key, iv, mode, padding: "pkcs7" };
      const native = crypto.createCipheriv("aes-" + size * 8 + "-" + mode, key, iv);
      const expected = Buffer.concat([native.update(input), native.final()]).toString("hex").toUpperCase();
      const encrypted = blocks.run({ ...options, input, direction: "encrypt" });
      assert.equal(toHex(encrypted.output), expected);
      const decrypted = blocks.run({ ...options, input: encrypted.output, direction: "decrypt" });
      assert.equal(decodeText(decrypted.output), "Chào Ba Ngòi 🔐\nUTF-8");
    });
  }
}

test("AES thể hiện khối lặp ở ECB và liên kết ở CBC", () => {
  const input = fromHex("00112233445566778899AABBCCDDEEFF".repeat(2));
  const options = { algorithm: "aes", key: new Uint8Array(16), iv: new Uint8Array(16),
    input, direction: "encrypt", padding: "none" };
  const ecb = blocks.run({ ...options, mode: "ecb" });
  const cbc = blocks.run({ ...options, mode: "cbc" });
  assert.deepEqual(ecb.blocks[0].output, ecb.blocks[1].output);
  assert.notDeepEqual(cbc.blocks[0].output, cbc.blocks[1].output);
});

test("PKCS#7 thêm nguyên một khối khi độ dài đã tròn khối", () => {
  const input = new Uint8Array(16).fill(254);
  const padded = bytes.pad(input, 16);
  assert.equal(padded.length, 32);
  assert.deepEqual(padded.slice(16), new Uint8Array(16).fill(16));
  assert.deepEqual(bytes.unpad(padded, 16), input);
});

test("PKCS#7 hỗ trợ bản rõ 0 byte", () => {
  const options = { algorithm: "aes", key: new Uint8Array(16), mode: "ecb", padding: "pkcs7" };
  const run = blocks.run({ ...options, input: new Uint8Array(), direction: "encrypt" });
  assert.equal(run.output.length, 16);
  assert.equal(blocks.run({ ...options, input: run.output, direction: "decrypt" }).output.length, 0);
});

test("Giải mã từ chối chuỗi byte đệm PKCS#7 hỏng", () => {
  const options = { algorithm: "des", key: desKey, mode: "ecb", padding: "none" };
  const bad = blocks.run({ ...options, input: fromHex("0102030405060302"), direction: "encrypt" });
  assert.throws(() => blocks.run({ ...options, padding: "pkcs7", input: bad.output, direction: "decrypt" }), /PKCS#7/);
});

test("Mã khối từ chối khóa, IV và kích thước khối sai", () => {
  assert.throws(() => des.makeCipher(new Uint8Array(7)), /8 byte/);
  assert.throws(() => aes.makeCipher(new Uint8Array(20)), /16, 24 hoặc 32/);
  assert.throws(() => blocks.run({ ...desCbc, padding: "none", iv: new Uint8Array(7) }), /IV/);
  assert.throws(() => blocks.run({ ...desCbc, padding: "none", input: new Uint8Array(9) }), /bội số/);
  assert.throws(() => blocks.run({ ...desCbc, padding: "pkcs7", direction: "decrypt", input: new Uint8Array(7) }), /bội số/);
});

test("Bộ chuyển đổi kiểm tra Hex và Unicode", () => {
  assert.equal(toHex(fromHex("00 Ff\n11")), "00FF11");
  assert.throws(() => fromHex("A"), /mỗi byte/);
  assert.throws(() => fromHex("XY"), /mỗi byte/);
  assert.throws(() => encodeText("\uD800"), /Unicode/);
  assert.throws(() => decodeText(new Uint8Array([0xFF])), TypeError);
});
