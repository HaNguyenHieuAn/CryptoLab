(() => {
  "use strict";

  const lab = globalThis.CryptoLab;
  const { fromHex, toHex, encodeText, decodeText, randomBytes } = lab.bytes;
  const { element, showError, setDirection, copy, setOptions, dlRows } = lab.ui;
  const configurations = {
    des: {
      title: "DES", size: 8,
      description: "Quan sát mạng Feistel 16 vòng và thứ tự dùng khóa con.",
      example: { key: "133457799BBCDFF1", mode: "ecb", iv: "", input: "0123456789ABCDEF" }
    },
    aes: {
      title: "AES", size: 16,
      description: "Theo dõi trạng thái 4 × 4 byte và phép biến đổi ở từng vòng.",
      example: { key: "2B7E151628AED2A6ABF7158809CF4F3C", mode: "cbc",
        iv: "000102030405060708090A0B0C0D0E0F", input: "6BC1BEE22E409F96E93D7E117393172A\nAE2D8A571E03AC9C9EB76FAC45AF8E51" }
    }
  };
  const stageHints = {
    "Đầu vào": "Điền khối vào ma trận 4 × 4 theo thứ tự cột.",
    AddRoundKey: "XOR các byte trạng thái với khóa của vòng hiện tại.",
    SubBytes: "Thay từng byte theo bảng S-box.",
    ShiftRows: "Dịch vòng sang trái theo số thứ tự hàng 0, 1, 2 và 3.",
    MixColumns: "Trộn mỗi cột bằng phép nhân ma trận trên trường GF(2⁸).",
    InvSubBytes: "Thay từng byte theo bảng S-box nghịch đảo.",
    InvShiftRows: "Dịch vòng sang phải theo số thứ tự hàng 0, 1, 2 và 3.",
    InvMixColumns: "Khôi phục từng cột bằng ma trận nghịch đảo trên GF(2⁸)."
  };

  function numberHex(value, length = 8) {
    return value.toString(16).toUpperCase().padStart(length, "0");
  }

  function desRoundView(view, step) {
    const list = element("dl", undefined, "hex-list");
    let title;
    let caption;
    let rows;
    if (step.type === "initial") {
      title = "Hoán vị đầu IP";
      caption = "Hoán vị 64 bit rồi chia thành hai nửa 32 bit.";
      rows = [["L0", numberHex(step.left)], ["R0", numberHex(step.right)]];
    } else if (step.type === "final") {
      title = "Hoán vị cuối IP⁻¹";
      caption = "Đặt R16 trước L16 rồi áp dụng hoán vị nghịch đảo của IP.";
      rows = [["R16 ‖ L16", numberHex(step.swapped, 16)], ["Đầu ra", numberHex(step.state, 16)]];
    } else {
      const n = step.number;
      title = "Vòng Feistel " + n;
      caption = "L" + n + " = R" + (n - 1) + " và R" + n + " = L" + (n - 1) + " ⊕ f(R" + (n - 1) + ", K" + step.keyIndex + ").";
      rows = [
        ["L" + (n - 1) + " ‖ R" + (n - 1), numberHex(step.leftInput) + " " + numberHex(step.rightInput)],
        ["Khóa con K" + step.keyIndex, numberHex(step.subkey, 12)],
        ["Mở rộng E(R)", numberHex(step.expansion, 12)],
        ["E(R) ⊕ K", numberHex(step.mixed, 12)],
        ["Qua 8 S-box", numberHex(step.sOutput)],
        ["Qua P · f(R, K)", numberHex(step.fOutput)],
        ["L" + n + " ‖ R" + n, numberHex(step.left) + " " + numberHex(step.right)]
      ];
    }
    dlRows(list, rows);
    view.replaceChildren(element("h3", title), element("p", caption), list);
  }

  function aesRoundView(view, trace, round) {
    const steps = trace.map((step, index) => ({ ...step, index })).filter(step => step.round === round);
    const buttons = element("div", undefined, "stage-list");
    buttons.setAttribute("role", "group");
    buttons.setAttribute("aria-label", "Phép biến đổi AES");
    const matrix = element("div", undefined, "aes-state");
    matrix.setAttribute("role", "img");
    const grid = element("div", undefined, "aes-trace-grid");
    grid.append(buttons, matrix);
    const hint = element("p");
    const key = element("p", undefined, "round-key");
    const serializedState = element("p", undefined, "round-key");
    const choices = steps.map((step, index) => {
      const button = element("button");
      button.type = "button";
      button.append(element("span", String(index + 1).padStart(2, "0")), document.createTextNode(step.name));
      button.addEventListener("click", () => displayStep(index));
      return button;
    });
    buttons.append(...choices);
    view.replaceChildren(element("h3", "Trạng thái AES · Vòng " + round), hint, grid, serializedState, key);
    displayStep(0);

    function displayStep(selected) {
      const step = steps[selected];
      const previous = trace[step.index - 1]?.state;
      const cells = Array.from({ length: 16 }, (_, i) => {
        const index = (i % 4) * 4 + Math.floor(i / 4);
        const changed = previous && previous[index] !== step.state[index];
        return element("span", numberHex(step.state[index], 2), changed ? "cell-changed" : undefined);
      });
      matrix.replaceChildren(...cells);
      matrix.setAttribute("aria-label", "Ma trận trạng thái theo hàng. " + cells.map(cell => cell.textContent).join(" "));
      hint.textContent = stageHints[step.name];
      serializedState.textContent = "State · " + toHex(step.state);
      key.hidden = !step.roundKey;
      key.textContent = step.roundKey ? "Khóa vòng · " + toHex(step.roundKey) : "";
      choices.forEach((button, i) => button.setAttribute("aria-pressed", String(i === selected)));
    }
  }

  function init(algorithm) {
    const config = configurations[algorithm];
    const aes = algorithm === "aes";
    const template = document.getElementById("block-template");
    const root = template.content.firstElementChild.cloneNode(true);
    const fields = new Map();
    root.id = "panel-" + algorithm;
    root.setAttribute("aria-labelledby", algorithm + "-title");
    for (const field of root.querySelectorAll("[data-id]")) {
      field.id = algorithm + "-" + field.dataset.id;
      fields.set(field.dataset.id, field);
    }
    for (const label of root.querySelectorAll("[data-for]")) label.htmlFor = algorithm + "-" + label.dataset.for;
    template.before(root);

    const get = id => fields.get(id);
    const buttons = root.querySelectorAll("[data-direction]");
    get("title").textContent = "Mã hóa " + config.title;
    get("description").textContent = config.description;
    get("hero-size").textContent = (config.size * 8) + " bit";
    get("size-field").hidden = !aes;
    if (!aes) {
      get("key-grid").classList.replace("two", "one");
      get("hero-rounds").textContent = "16 vòng Feistel";
    }

    let result;
    let direction = "encrypt";
    let activeTrace;
    let roundNumbers;

    function clear() {
      result = undefined;
      showError(get("error"));
      get("result").hidden = true;
      get("trace").hidden = true;
      get("empty").hidden = false;
    }

    function expectedKeyBytes() {
      return aes ? Number(get("size").value) : 8;
    }

    function updateLabels() {
      const size = expectedKeyBytes();
      const cbc = get("mode").value === "cbc";
      const encrypt = direction === "encrypt";
      const hexKey = get("key-format").value === "hex";
      const hexData = get("data-format").value === "hex";
      if (aes) get("hero-rounds").textContent = (size / 4 + 6) + " vòng";
      get("key-note").textContent = (hexKey ? size * 2 + " ký tự Hex" : size + " byte UTF-8") +
        (aes ? " cho AES-" + size * 8 + "." : " cho khóa DES 56 bit hiệu dụng.");
      get("key").placeholder = hexKey ? "Nhập khóa dạng Hex" : "Nhập khóa dạng văn bản";
      get("iv-field").hidden = !cbc;
      get("iv").placeholder = config.size * 2 + " ký tự Hex";
      get("new-iv").hidden = !encrypt;
      get("iv-note").textContent = encrypt
        ? "Để trống để tạo IV ngẫu nhiên cho lần mã hóa này."
        : "Nhập IV đã dùng khi mã hóa.";
      get("input-label").textContent = encrypt ? "Bản rõ" : "Bản mã Hex";
      get("data-format").setAttribute("aria-label", encrypt ? "Định dạng bản rõ" : "Định dạng kết quả bản rõ");
      get("input-note").textContent = encrypt
        ? (hexData ? "Hai ký tự Hex cho mỗi byte." : "Hỗ trợ tiếng Việt và các ký tự Unicode.")
        : "Nhập bản mã Hex. Chọn cách đọc kết quả bản rõ ở bên cạnh.";
      get("trace-mode").textContent = get("mode").value.toUpperCase();
    }

    function directionChange(next) {
      direction = next;
      setDirection(buttons, next, button => button.dataset.direction, get("run"), get("reverse"));
      updateLabels();
      clear();
    }

    function showRound() {
      const selected = get("round").selectedIndex;
      if (aes) aesRoundView(get("round-view"), activeTrace, roundNumbers[selected]);
      else desRoundView(get("round-view"), activeTrace[selected]);
    }

    function showBlock() {
      const index = get("block").selectedIndex;
      const { input, chain, primitiveInput, primitiveOutput, output } = result.blocks[index];
      const encrypt = direction === "encrypt";
      const number = index + 1;
      const plain = "P" + number;
      const cipher = "C" + number;
      const linked = index === 0 ? "IV" : "C" + index;
      const rows = [[(encrypt ? plain : cipher) + " · Đầu vào", toHex(input)]];
      if (chain) rows.push([linked + " · Liên kết", toHex(chain)]);
      if (chain && encrypt) rows.push([plain + " ⊕ " + linked, toHex(primitiveInput)]);
      if (chain && !encrypt) rows.push(["Dₖ(" + cipher + ")", toHex(primitiveOutput)]);
      rows.push([(encrypt ? cipher : plain) + " · " + (chain && !encrypt ? "Sau XOR" : "Đầu ra"), toHex(output)]);
      dlRows(get("flow"), rows);
      activeTrace = result.traceBlock(index);
      if (aes) {
        roundNumbers = [...new Set(activeTrace.map(step => step.round))];
        setOptions(get("round"), roundNumbers.map(round => "Vòng " + round), 1);
      } else {
        setOptions(get("round"), activeTrace.map(step => step.type === "round" ? "Vòng " + step.number :
          step.type === "initial" ? "Hoán vị đầu IP" : "Hoán vị cuối IP⁻¹"), 1);
      }
      showRound();
    }

    function run() {
      clear();
      try {
        const raw = get("input").value;
        if (raw.length > 65536) throw new Error("Dữ liệu vượt giới hạn của mô phỏng.");
        const decrypt = direction === "decrypt";
        const mode = get("mode").value;
        const padding = get("padding").value;
        const plainFormat = get("data-format").value;
        const readsHex = decrypt || plainFormat === "hex";
        const input = readsHex
          ? (!decrypt && !raw.trim() && padding === "pkcs7" ? new Uint8Array() : fromHex(raw, decrypt ? "Bản mã Hex" : "Bản rõ Hex"))
          : encodeText(raw);
        const maxBytes = 8192 + (decrypt ? config.size : 0);
        if (input.length > maxBytes) throw new Error("Dữ liệu đầu vào tối đa " + maxBytes + " byte.");

        const key = get("key-format").value === "hex" ? fromHex(get("key").value, "Khóa Hex") : encodeText(get("key").value);
        if (key.length !== expectedKeyBytes()) {
          throw new Error("Khóa " + config.title + " cần đúng " + expectedKeyBytes() + " byte. Đã nhập " + key.length + " byte.");
        }
        let iv;
        if (mode === "cbc") {
          const rawIv = get("iv").value;
          if (decrypt && !rawIv.trim()) throw new Error("Giải mã CBC cần IV đã dùng khi mã hóa.");
          iv = rawIv.trim() ? fromHex(rawIv, "IV Hex") : randomBytes(config.size);
        }
        const computed = lab.blocks.run({ algorithm, input, key, iv, mode, padding, direction });
        let display = toHex(computed.output);
        let outputFormat = "hex";
        let note = input.length + " → " + computed.output.length + " byte · " + computed.blocks.length + " khối";
        if (padding === "pkcs7") note += " · " + (decrypt ? "Bỏ " : "Thêm ") + computed.paddingBytes + " byte đệm";
        if (decrypt && plainFormat === "text") {
          try {
            display = decodeText(computed.output);
            outputFormat = "text";
          } catch {
            note += " · Dữ liệu UTF-8 lỗi, hiển thị Hex";
          }
        }
        const ivHex = iv ? toHex(iv) : "";
        if (ivHex) note += " · IV " + ivHex;
        result = { ...computed, display, outputFormat, ivHex };
        get("result-label").textContent = decrypt ? "Bản rõ " + (outputFormat === "hex" ? "Hex" : "UTF-8") : "Bản mã Hex";
        get("output").textContent = display;
        get("result-note").textContent = note;
        setOptions(get("block"), result.blocks.map((_, index) => "Khối " + (index + 1) + " / " + result.blocks.length));
        showBlock();
        get("trace").hidden = false;
        get("empty").hidden = true;
        get("result").hidden = false;
      } catch (error) {
        showError(get("error"), error);
      }
    }

    function loadExample() {
      const sample = config.example;
      get("size").value = "16";
      get("key-format").value = "hex";
      get("data-format").value = "hex";
      get("padding").value = "none";
      get("mode").value = sample.mode;
      get("key").value = sample.key;
      get("iv").value = sample.iv;
      get("input").value = sample.input;
      directionChange("encrypt");
      run();
    }

    get("form").addEventListener("submit", event => { event.preventDefault(); run(); });
    for (const id of ["mode", "padding", "size", "key-format", "data-format"]) {
      get(id).addEventListener("change", () => { updateLabels(); clear(); });
    }
    for (const id of ["iv", "key", "input"]) get(id).addEventListener("input", clear);
    for (const button of buttons) {
      button.addEventListener("click", () => {
        if (direction !== button.dataset.direction) directionChange(button.dataset.direction);
      });
    }
    get("new-iv").addEventListener("click", () => {
      clear();
      try {
        get("iv").value = toHex(randomBytes(config.size));
      } catch (error) {
        showError(get("error"), error);
      }
    });
    get("example").addEventListener("click", loadExample);
    get("copy").addEventListener("click", () => copy(get("output")));
    get("reverse").addEventListener("click", () => {
      const previous = result;
      const reverse = direction === "encrypt" ? "decrypt" : "encrypt";
      if (reverse === "encrypt") get("data-format").value = previous.outputFormat;
      if (previous.ivHex) get("iv").value = previous.ivHex;
      directionChange(reverse);
      get("input").value = previous.display;
      get("input").focus();
    });
    get("block").addEventListener("change", showBlock);
    get("round").addEventListener("change", showRound);
    loadExample();
  }

  lab.initBlocks = init;
})();
