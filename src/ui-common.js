(() => {
  "use strict";

  const lab = globalThis.CryptoLab;
  const names = { encrypt: "Mã hóa", decrypt: "Giải mã" };
  let toastTimer;

  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (className) node.className = className;
    return node;
  }

  function showError(node, error) {
    node.textContent = error ? error.message : "";
    node.hidden = !error;
  }

  function setDirection(buttons, direction, read, submit, reverse) {
    for (const button of buttons) button.setAttribute("aria-pressed", String(read(button) === direction));
    submit.firstChild.textContent = names[direction] + " ";
    reverse.firstChild.textContent = direction === "encrypt" ? "Dùng để giải mã " : "Dùng để mã hóa ";
  }

  function status(message) {
    const toast = document.getElementById("status");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 2500);
  }

  async function copy(node) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(node.textContent);
        status("Đã sao chép kết quả.");
        return;
      } catch {
        // Chế độ tệp cục bộ có thể giới hạn Clipboard API.
      }
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    node.focus({ preventScroll: true });
    if (document.execCommand("copy")) {
      selection.removeAllRanges();
      status("Đã sao chép kết quả.");
    } else {
      status("Đã chọn kết quả. Nhấn Ctrl+C hoặc Command+C để sao chép.");
    }
  }

  function table(headers, rows) {
    const result = element("table", undefined, "trace-table");
    const head = element("thead");
    const fields = element("tr");
    for (const header of headers) {
      const th = element("th", header);
      th.scope = "col";
      fields.append(th);
    }
    head.append(fields);
    const body = element("tbody");
    for (const row of rows) {
      const tr = element("tr");
      for (const value of row) tr.append(element("td", value));
      body.append(tr);
    }
    result.append(head, body);
    return result;
  }

  function setOptions(select, items, index = 0) {
    select.replaceChildren(...items.map((label, i) => new Option(label, i)));
    select.selectedIndex = index;
  }

  function dlRows(list, rows) {
    list.replaceChildren(...rows.map(([label, data]) => {
      const line = element("div");
      line.append(element("dt", label), element("dd", data));
      return line;
    }));
  }

  lab.ui = { element, showError, setDirection, copy, table, setOptions, dlRows };
})();
