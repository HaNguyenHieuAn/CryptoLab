(() => {
  "use strict";

  const lab = globalThis.CryptoLab;
  const { element, showError, setDirection, copy, dlRows } = lab.ui;
  const example = { key: "PLAYFAIR EXAMPLE", message: "Hide the gold in the tree stump" };

  function init() {
    const box = document.getElementById("panel-playfair");
    const get = id => box.querySelector("#pf-" + id);
    const buttons = box.querySelectorAll("[data-pf-direction]");
    let direction = "encrypt";
    let result;
    let stepIndex = 0;

    function matrixView(matrix, step) {
      const header = element("thead");
      const top = element("tr");
      top.append(element("td", undefined, "row-axis"));
      for (let col = 1; col <= 5; col++) {
        const th = element("th", col);
        th.scope = "col";
        top.append(th);
      }
      header.append(top);
      const body = element("tbody");
      for (let row = 0; row < 5; row++) {
        const line = element("tr");
        const th = element("th", row + 1);
        th.scope = "row";
        line.append(th);
        for (let col = 0; col < 5; col++) {
          const letter = matrix?.letters[row * 5 + col] ?? "·";
          const source = step?.from.some(pos => pos.row === row && pos.col === col);
          const target = step?.to.some(pos => pos.row === row && pos.col === col);
          const cell = element("td", letter);
          if (matrix?.keyLetters.includes(letter)) cell.classList.add("key-cell");
          if (source && target) cell.classList.add("cell-both");
          else if (source) cell.classList.add("cell-in");
          else if (target) cell.classList.add("cell-out");
          if (source || target) {
            const role = source && target ? "cặp vào và cặp ra" : source ? "cặp vào" : "cặp ra";
            cell.setAttribute("aria-label", letter + ", " + role);
          }
          line.append(cell);
        }
        body.append(line);
      }
      get("matrix").replaceChildren(header, body);
    }

    function clear() {
      result = undefined;
      showError(get("error"));
      get("result").hidden = true;
      get("trace").hidden = true;
      get("empty").hidden = false;
      try {
        matrixView(lab.playfair.makeMatrix(get("key").value));
      } catch {
        matrixView();
      }
    }

    function choose(index) {
      if (!result || index < 0 || index >= result.steps.length) return;
      stepIndex = index;
      const step = result.steps[index];
      matrixView(result.matrix, step);
      get("step-count").textContent = "Cặp " + (index + 1) + " / " + result.steps.length;
      get("prev").disabled = index === 0;
      get("next").disabled = index === result.steps.length - 1;
      const arrow = element("span", "→");
      arrow.setAttribute("aria-hidden", "true");
      get("current").replaceChildren(element("span", step.input, "pair-token mono"), arrow,
        element("span", step.output, "pair-token mono out"), element("strong", step.rule, "rule-name"));
      get("explain").textContent = step.hint;
      get("filler").hidden = !step.filler;
      get("filler").textContent = step.filler ? "Chèn " + step.filler + " để " + step.reason + "." : "";
      Array.from(get("pairs").children).forEach((button, i) => {
        button.setAttribute("aria-pressed", String(i === index));
      });
      const scroller = get("pairs");
      const active = scroller.children[index];
      const activeBox = active.getBoundingClientRect();
      const listBox = scroller.getBoundingClientRect();
      if (activeBox.bottom > listBox.bottom) scroller.scrollTop += activeBox.bottom - listBox.bottom + 4;
      if (activeBox.top < listBox.top) scroller.scrollTop -= listBox.top - activeBox.top + 4;
    }

    function run() {
      clear();
      try {
        result = lab.playfair.run(get("input").value, get("key").value, direction);
        get("output").textContent = result.output;
        const encrypting = direction === "encrypt";
        get("result-label").textContent = encrypting ? "Bản mã" : "Bản rõ sau xử lý";
        const fillerCount = result.steps.filter(step => step.filler).length;
        get("result-note").textContent = encrypting
          ? result.steps.length + " cặp · " + fillerCount + " ký tự đệm"
          : "Giữ X/Q để bạn đối chiếu các ký tự đã chèn.";
        dlRows(get("prepared"), [
          ["Khóa bỏ trùng", result.matrix.keyLetters.join("")],
          ["Đã chuẩn hóa", result.normalized],
          ["Các cặp vào", result.steps.map(step => step.input).join(" ")]
        ]);
        const choices = result.steps.map((step, i) => {
          const button = element("button", step.input);
          button.type = "button";
          button.setAttribute("aria-label", "Cặp " + (i + 1) + " " + step.input);
          button.addEventListener("click", () => choose(i));
          return button;
        });
        get("pairs").replaceChildren(...choices);
        get("pairs").scrollTop = 0;
        get("empty").hidden = true;
        get("trace").hidden = false;
        get("result").hidden = false;
        choose(0);
      } catch (error) {
        showError(get("error"), error);
      }
    }

    function change(next) {
      direction = next;
      setDirection(buttons, next, button => button.dataset.pfDirection, get("run"), get("reverse"));
      get("input-label").textContent = next === "encrypt" ? "Bản rõ" : "Bản mã";
      get("input-note").textContent = next === "encrypt" ?
        "Ứng dụng bỏ dấu và giữ các chữ cái Latin." : "Nhập số chữ chẵn. Bản mã dùng I thay cho J.";
      clear();
    }

    function loadExample() {
      get("key").value = example.key;
      get("input").value = example.message;
      change("encrypt");
      run();
    }

    get("form").addEventListener("submit", event => { event.preventDefault(); run(); });
    get("key").addEventListener("input", clear);
    get("input").addEventListener("input", clear);
    get("example").addEventListener("click", loadExample);
    get("copy").addEventListener("click", () => copy(get("output")));
    get("reverse").addEventListener("click", () => {
      const previous = result.output;
      change(direction === "encrypt" ? "decrypt" : "encrypt");
      get("input").value = previous;
      get("input").focus();
    });
    get("prev").addEventListener("click", () => choose(stepIndex - 1));
    get("next").addEventListener("click", () => choose(stepIndex + 1));
    for (const button of buttons) {
      button.addEventListener("click", () => {
        if (direction !== button.dataset.pfDirection) change(button.dataset.pfDirection);
      });
    }
    loadExample();
  }

  lab.initPlayfair = init;
})();
