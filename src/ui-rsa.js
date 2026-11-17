(() => {
  "use strict";

  const lab = globalThis.CryptoLab;
  const { element, showError, setDirection, copy, table, setOptions } = lab.ui;

  function init() {
    const box = document.getElementById("panel-rsa");
    const get = id => box.querySelector("#rsa-" + id);
    const buttons = box.querySelectorAll("[data-rsa-direction]");
    let keys;
    let result;
    let direction = "encrypt";

    function clearResult() {
      result = undefined;
      showError(get("data-error"));
      get("result").hidden = true;
      get("calc").hidden = true;
      get("calc-empty").hidden = false;
    }

    function invalidateKeys() {
      keys = undefined;
      showError(get("key-error"));
      get("key-summary").hidden = true;
      get("key-trace").hidden = true;
      get("key-empty").hidden = false;
      clearResult();
    }

    function keygen() {
      invalidateKeys();
      try {
        keys = lab.rsa.makeKeys(get("p").value, get("q").value, get("e").value);
        const { p, q, n, phi, e, d } = keys;
        get("public").textContent = "(" + n + ", " + e + ")";
        get("private").textContent = "(" + n + ", " + d + ")";
        const steps = [
          ["Tính môđun", "n = " + p + " × " + q + " = " + n],
          ["Tính hàm Euler", "φ(n) = (" + p + " − 1) × (" + q + " − 1) = " + phi],
          ["Kiểm tra số mũ công khai", "gcd(" + e + ", " + phi + ") = 1"],
          ["Tìm nghịch đảo modulo", "d = " + d + "  vì  (" + e + " × " + d + ") mod " + phi + " = 1"]
        ];
        get("derivation").replaceChildren(...steps.map(([label, value]) => {
          const li = element("li");
          const content = element("div");
          content.append(element("strong", label), element("code", value));
          li.append(content);
          return li;
        }));
        get("euclid").replaceChildren(table(["a", "b", "Thương", "Số dư"],
          keys.derivation.steps.map(step => [step.a, step.b, step.quotient, step.remainder])));
        get("key-summary").hidden = false;
        get("key-trace").hidden = false;
        get("key-empty").hidden = true;
      } catch (error) {
        showError(get("key-error"), error);
      }
    }

    function displayItem() {
      const selected = result.values[get("item").selectedIndex];
      const { input, output } = selected;
      const { exponent, n } = result;
      const encrypting = direction === "encrypt";
      const label = encrypting ? "c" : "m";
      get("formula").replaceChildren(document.createTextNode(label + " = " + input),
        element("sup", exponent), document.createTextNode(" mod " + n + " = " + output));
      get("formula-note").textContent = encrypting ? "Số mũ e lấy từ khóa công khai." : "Số mũ d lấy từ khóa bí mật.";
      const trace = [];
      lab.rsa.powMod(input, exponent, n, trace);
      get("powers").replaceChildren(table(["Bit", "Cơ số đã rút gọn", "Tích modulo"],
        trace.map(step => [step.bit, step.base, step.result])));
    }

    function run() {
      clearResult();
      try {
        if (!keys) throw new Error("Hãy tạo cặp khóa RSA từ p, q và e trước.");
        result = lab.rsa.run(get("input").value, keys, get("format").value, direction);
        get("result-label").textContent = direction === "encrypt" ? "Bản mã" : "Bản rõ";
        get("output").textContent = result.display;
        setOptions(get("item"), result.values.map((unit, i) => "Phần tử " + (i + 1) + " · " + unit.input));
        get("result").hidden = false;
        get("calc").hidden = false;
        get("calc-empty").hidden = true;
        displayItem();
      } catch (error) {
        showError(get("data-error"), error);
      }
    }

    function updateLabels() {
      const integer = get("format").value === "integer";
      const encrypting = direction === "encrypt";
      if (integer) {
        get("input-label").textContent = encrypting ? "Bản rõ m" : "Bản mã c";
        get("input-note").textContent = "Nhập một số nguyên từ 0 đến n − 1.";
        get("input").inputMode = "numeric";
      } else {
        get("input-label").textContent = encrypting ? "Bản rõ UTF-8" : "Dãy số bản mã";
        get("input-note").textContent = encrypting ? "Mỗi byte tạo một số bản mã. Tối đa 512 byte." : "Ngăn cách các số bằng dấu cách hoặc dấu phẩy.";
        get("input").inputMode = "text";
      }
    }

    function change(next) {
      direction = next;
      setDirection(buttons, next, button => button.dataset.rsaDirection, get("run"), get("reverse"));
      updateLabels();
      clearResult();
    }

    function loadExample() {
      get("p").value = "61";
      get("q").value = "53";
      get("e").value = "17";
      get("format").value = "integer";
      get("input").value = "65";
      change("encrypt");
      keygen();
      run();
    }

    get("key-form").addEventListener("submit", event => { event.preventDefault(); keygen(); });
    get("data-form").addEventListener("submit", event => { event.preventDefault(); run(); });
    ["p", "q", "e"].forEach(id => get(id).addEventListener("input", invalidateKeys));
    get("input").addEventListener("input", clearResult);
    get("format").addEventListener("change", () => { updateLabels(); clearResult(); });
    get("item").addEventListener("change", displayItem);
    get("example").addEventListener("click", loadExample);
    get("copy").addEventListener("click", () => copy(get("output")));
    get("reverse").addEventListener("click", () => {
      const previous = result.display;
      change(direction === "encrypt" ? "decrypt" : "encrypt");
      get("input").value = previous;
      get("input").focus();
    });
    for (const button of buttons) {
      button.addEventListener("click", () => {
        if (button.dataset.rsaDirection !== direction) change(button.dataset.rsaDirection);
      });
    }
    loadExample();
  }

  lab.initRsa = init;
})();
