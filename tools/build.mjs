import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const target = resolve(process.argv[2] ?? resolve(project, "dist", "CryptoLab.html"));
const template = await readFile(resolve(project, "index.html"), "utf8");
const cssTag = '<link rel="stylesheet" href="assets/lab.css">';
if (!template.includes(cssTag)) throw new Error("Không tìm thấy liên kết CSS trong index.html.");
const css = await readFile(resolve(project, "assets", "lab.css"), "utf8");
let standalone = template.replace(cssTag, () => "<style>\n" + css + "</style>");
const scripts = Array.from(template.matchAll(/<script src="(src\/[a-z-]+\.js)"><\/script>/g));
if (!scripts.length) throw new Error("Không tìm thấy các mô-đun ứng dụng.");
for (const [tag, path] of scripts) {
  const script = await readFile(resolve(project, path), "utf8");
  if (/<\/script/i.test(script)) throw new Error("Mô-đun chứa thẻ đóng script: " + path);
  standalone = standalone.replace(tag, () => "<script>\n" + script + "</script>");
}
await mkdir(dirname(target), { recursive: true });
await writeFile(target, standalone);
console.log(target);
