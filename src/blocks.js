(() => {
  "use strict";

  const lab = globalThis.CryptoLab ??= {};
  const { xor, pad, unpad } = lab.bytes;

  function run({ algorithm, input, key, iv, mode, padding, direction }) {
    if (!["des", "aes"].includes(algorithm) || !["cbc", "ecb"].includes(mode) ||
        !["pkcs7", "none"].includes(padding) || !["encrypt", "decrypt"].includes(direction)) {
      throw new Error("Hãy chọn thuật toán, chế độ, kiểu đệm và thao tác hợp lệ.");
    }
    const cipher = lab[algorithm].makeCipher(key);
    const { blockSize, rounds } = cipher;
    const useCbc = mode === "cbc";
    const decrypt = direction === "decrypt";
    const usesPadding = padding === "pkcs7";
    if (useCbc && iv?.length !== blockSize) {
      throw new Error("IV của CBC cần đúng " + blockSize + " byte.");
    }
    const data = !decrypt && usesPadding ? pad(input, blockSize) : input;
    if (!data.length || data.length % blockSize !== 0) {
      throw new Error((decrypt ? "Bản mã" : "Dữ liệu ở chế độ không đệm") +
        " cần có độ dài là bội số dương của " + blockSize + " byte.");
    }

    const output = new Uint8Array(data.length);
    const blocks = [];
    let chain = useCbc ? iv : null;
    for (let offset = 0; offset < data.length; offset += blockSize) {
      const block = data.slice(offset, offset + blockSize);
      // CBC mã hóa XOR trước E_K. CBC giải mã XOR sau D_K.
      const primitiveInput = useCbc && !decrypt ? xor(block, chain) : block;
      const primitiveOutput = cipher.transform(primitiveInput, decrypt);
      const result = useCbc && decrypt ? xor(primitiveOutput, chain) : primitiveOutput;
      output.set(result, offset);
      blocks.push({ input: block, chain, primitiveInput, primitiveOutput, output: result });
      if (useCbc) chain = decrypt ? block : result;
    }
    const final = decrypt && usesPadding ? unpad(output, blockSize) : output;
    const paddingBytes = decrypt ? output.length - final.length : data.length - input.length;

    function traceBlock(index) {
      const trace = [];
      cipher.transform(blocks[index].primitiveInput, decrypt, trace);
      return trace;
    }

    return { output: final, blocks, rounds, blockSize, paddingBytes, traceBlock };
  }

  lab.blocks = { run };
})();
