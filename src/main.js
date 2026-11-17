(() => {
  "use strict";

  const lab = globalThis.CryptoLab;
  const names = { playfair: "Playfair", rsa: "RSA", des: "DES", aes: "AES" };
  lab.initPlayfair();
  lab.initRsa();
  lab.initBlocks("des");
  lab.initBlocks("aes");

  const navigation = document.querySelectorAll("[data-open]");
  for (const button of navigation) {
    button.addEventListener("click", () => {
      const selected = button.dataset.open;
      for (const link of navigation) {
        const active = link.dataset.open === selected;
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
        document.getElementById("panel-" + link.dataset.open).hidden = !active;
      }
      document.getElementById("breadcrumb-alg").textContent = names[selected];
      document.querySelector("#panel-" + selected + " h1").focus({ preventScroll: true });
      window.scrollTo(0, 0);
    });
  }

  const help = document.getElementById("help");
  document.getElementById("open-help").addEventListener("click", () => help.showModal());
})();
