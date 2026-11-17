(() => {
  "use strict";

  const lab = globalThis.CryptoLab ??= {};
  const blockSize = 16;

  function multiply(left, right) {
    let product = 0;
    for (; right > 0; right >>= 1) {
      if (right & 1) product ^= left;
      // Xtime trong GF(2^8), giảm theo đa thức Rijndael 0x11B.
      left = (left << 1) ^ (left & 0x80 ? 0x11B : 0);
    }
    return product;
  }

  function power(value, exponent) {
    let result = 1;
    for (; exponent > 0; exponent >>= 1) {
      if (exponent & 1) result = multiply(result, value);
      value = multiply(value, value);
    }
    return result;
  }

  function rotateByte(byte, count) {
    return ((byte << count) | (byte >> (8 - count))) & 255;
  }

  const sbox = Uint8Array.from({ length: 256 }, (_, byte) => {
    const inv = byte === 0 ? 0 : power(byte, 254);
    return inv ^ rotateByte(inv, 1) ^ rotateByte(inv, 2) ^ rotateByte(inv, 3) ^ rotateByte(inv, 4) ^ 0x63;
  });
  const invSbox = new Uint8Array(256);
  sbox.forEach((value, index) => { invSbox[value] = index; });

  const multiplication = Array.from({ length: 15 }, (_, factor) => {
    return Uint8Array.from({ length: 256 }, (_, byte) => multiply(factor, byte));
  });
  const columnCoefficients = [2, 3, 1, 1];
  const inverseCoefficients = [14, 11, 13, 9];

  function expandKey(key, rounds) {
    const expanded = new Uint8Array(blockSize * (rounds + 1));
    expanded.set(key);
    let rcon = 1;
    for (let offset = key.length; offset < expanded.length; offset += 4) {
      const word = expanded.slice(offset - 4, offset);
      if (offset % key.length === 0) {
        const [a, b, c, d] = word;
        word.set([sbox[b] ^ rcon, sbox[c], sbox[d], sbox[a]]);
        rcon = multiply(rcon, 2);
      } else if (key.length === 32 && offset % key.length === 16) {
        for (let i = 0; i < 4; i++) word[i] = sbox[word[i]];
      }
      for (let i = 0; i < 4; i++) expanded[offset + i] = expanded[offset + i - key.length] ^ word[i];
    }
    return expanded;
  }

  function addRoundKey(state, expanded, index) {
    for (let i = 0; i < blockSize; i++) state[i] ^= expanded[index * blockSize + i];
  }

  function substitute(state, box) {
    for (let i = 0; i < blockSize; i++) state[i] = box[state[i]];
  }

  function shiftRows(state, inverse) {
    const source = state.slice();
    const sign = inverse ? -1 : 1;
    // State theo cột: ô (hàng, cột) có chỉ số 4 * cột + hàng.
    for (let row = 1; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        state[col * 4 + row] = source[((col + 4 + sign * row) % 4) * 4 + row];
      }
    }
  }

  function mixColumns(state, coefficients) {
    for (let col = 0; col < blockSize; col += 4) {
      const source = state.slice(col, col + 4);
      for (let row = 0; row < 4; row++) {
        let mixed = 0;
        for (let k = 0; k < 4; k++) {
          mixed ^= multiplication[coefficients[(k + 4 - row) % 4]][source[k]];
        }
        state[col + row] = mixed;
      }
    }
  }

  function makeCipher(key) {
    if (![16, 24, 32].includes(key.length)) throw new Error("Khóa AES cần đúng 16, 24 hoặc 32 byte.");
    const rounds = key.length / 4 + 6;
    const expanded = expandKey(key, rounds);

    function encrypt(state, addKey, record) {
      addKey(0);
      for (let round = 1; round <= rounds; round++) {
        substitute(state, sbox);
        record(round, "SubBytes");
        shiftRows(state, false);
        record(round, "ShiftRows");
        if (round !== rounds) {
          mixColumns(state, columnCoefficients);
          record(round, "MixColumns");
        }
        addKey(round);
      }
    }

    function decrypt(state, addKey, record) {
      addKey(rounds);
      for (let round = rounds - 1; round >= 0; round--) {
        shiftRows(state, true);
        record(round, "InvShiftRows");
        substitute(state, invSbox);
        record(round, "InvSubBytes");
        addKey(round);
        if (round !== 0) {
          mixColumns(state, inverseCoefficients);
          record(round, "InvMixColumns");
        }
      }
    }

    function transform(block, inverse, trace) {
      if (block.length !== blockSize) throw new Error("Một khối AES cần đúng 16 byte.");
      const state = block.slice();
      function record(round, name, roundKey) {
        trace?.push({ round, name, state: state.slice(), roundKey });
      }
      function addKey(round) {
        addRoundKey(state, expanded, round);
        if (trace) record(round, "AddRoundKey", expanded.slice(round * blockSize, (round + 1) * blockSize));
      }
      record(inverse ? rounds : 0, "Đầu vào");
      (inverse ? decrypt : encrypt)(state, addKey, record);
      return state;
    }

    return { blockSize, rounds, transform };
  }

  lab.aes = { makeCipher };
})();
