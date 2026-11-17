(() => {
  "use strict";

  const lab = globalThis.CryptoLab ??= {};
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  const rules = {
    row: { label: "Cùng hàng", encrypt: "Dịch mỗi chữ một ô sang phải và quay vòng ở mép.",
      decrypt: "Dịch mỗi chữ một ô sang trái và quay vòng ở mép." },
    column: { label: "Cùng cột", encrypt: "Dịch mỗi chữ một ô xuống dưới và quay vòng ở mép.",
      decrypt: "Dịch mỗi chữ một ô lên trên và quay vòng ở mép." },
    rectangle: { label: "Hình chữ nhật", encrypt: "Giữ hàng của mỗi chữ rồi đổi cột cho nhau.",
      decrypt: "Giữ hàng của mỗi chữ rồi đổi cột cho nhau." }
  };

  function normalize(value) {
    return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "D")
      .replace(/[^A-Za-z]/g, "").toUpperCase().replaceAll("J", "I");
  }

  function makeMatrix(key) {
    const clean = normalize(key);
    if (!clean) {
      throw new Error("Khóa Playfair cần có ít nhất một chữ cái Latin.");
    }
    const keyLetters = Array.from(new Set(clean));
    const letters = Array.from(new Set(clean + alphabet));
    const positions = new Map(letters.map((letter, index) => [
      letter, { row: Math.floor(index / 5), col: index % 5 }
    ]));
    return { keyLetters, letters, positions };
  }

  function encryptPairs(text) {
    const pairs = [];
    for (let i = 0; i < text.length;) {
      const first = text[i++];
      const second = text[i];
      if (second && second !== first) {
        pairs.push({ input: first + second });
        i++;
      } else {
        // Chọn Q khi gặp X để cặp đã chèn luôn có hai chữ khác nhau.
        const filler = first === "X" ? "Q" : "X";
        pairs.push({ input: first + filler, filler,
          reason: second ? "tách hai chữ trùng" : "bổ sung chữ cuối" });
      }
    }
    return pairs;
  }

  function decryptPairs(text) {
    if (text.length % 2 !== 0) {
      throw new Error("Bản mã Playfair cần có số chữ chẵn.");
    }
    const pairs = [];
    for (let i = 0; i < text.length; i += 2) {
      if (text[i] === text[i + 1]) {
        throw new Error("Cặp bản mã số " + (i / 2 + 1) + " chứa hai chữ giống nhau.");
      }
      pairs.push({ input: text.slice(i, i + 2) });
    }
    return pairs;
  }

  function transformPair(matrix, pair, direction) {
    const [a, b] = Array.from(pair.input, letter => matrix.positions.get(letter));
    const shift = direction === "encrypt" ? 1 : 4;
    let rule;
    let to;
    if (a.row === b.row) {
      rule = "row";
      to = [a, b].map(pos => ({ row: pos.row, col: (pos.col + shift) % 5 }));
    } else if (a.col === b.col) {
      rule = "column";
      to = [a, b].map(pos => ({ row: (pos.row + shift) % 5, col: pos.col }));
    } else {
      rule = "rectangle";
      to = [{ row: a.row, col: b.col }, { row: b.row, col: a.col }];
    }
    const output = to.map(pos => matrix.letters[pos.row * 5 + pos.col]).join("");
    return { ...pair, output, from: [a, b], to, rule: rules[rule].label, hint: rules[rule][direction] };
  }

  function run(message, key, direction) {
    if (direction !== "encrypt" && direction !== "decrypt") {
      throw new Error("Hãy chọn thao tác mã hóa hoặc giải mã.");
    }
    const matrix = makeMatrix(key);
    const encrypting = direction === "encrypt";
    const cleaned = encrypting ? normalize(message) : message.replace(/\s/g, "");
    const maximum = encrypting ? 1200 : 2400;
    if (!cleaned || cleaned.length > maximum) {
      throw new Error("Thông điệp Playfair cần từ 1 đến " + maximum.toLocaleString("vi-VN") + " chữ cái.");
    }
    if (!encrypting && !/^[A-IK-Z]+$/i.test(cleaned)) {
      throw new Error("Bản mã Playfair chỉ dùng chữ A–Z với I thay cho J.");
    }
    const normalized = cleaned.toUpperCase();
    const pairs = encrypting ? encryptPairs(normalized) : decryptPairs(normalized);
    const steps = pairs.map(pair => transformPair(matrix, pair, direction));
    return {
      matrix, normalized, steps,
      prepared: pairs.map(pair => pair.input).join(""),
      output: steps.map(step => step.output).join("")
    };
  }

  lab.playfair = { normalize, makeMatrix, run };
})();
