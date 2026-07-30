import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(projectRoot, "dist");
const pagesRoot = resolve(projectRoot, "docs");
const htmlPath = resolve(outputRoot, "index.html");
const previewImagePath = resolve(pagesRoot, "illu.png");
const llmsTextPath = resolve(pagesRoot, "llms.txt");
const faviconPath = resolve(pagesRoot, "favicon.png");

let html = await readFile(htmlPath, "utf8");

const scriptMatch = html.match(
  /<script type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/,
);
const styleMatch = html.match(
  /<link rel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/,
);

if (!scriptMatch || !styleMatch) {
  throw new Error("Could not find the generated script and stylesheet.");
}

const toOutputPath = (assetPath) =>
  resolve(outputRoot, assetPath.replace(/^\.\//, ""));

const [javascript, stylesheet] = await Promise.all([
  readFile(toOutputPath(scriptMatch[1]), "utf8"),
  readFile(toOutputPath(styleMatch[1]), "utf8"),
]);

if (javascript.includes("qr-scanner-worker.min-")) {
  throw new Error("The QR decoder worker was not embedded in the main bundle.");
}

const inlineScript = `<script type="module">\n${javascript.replace(
  /<\/script/gi,
  "<\\/script",
)}\n</script>`;
const inlineStyle = `<style>\n${stylesheet.replace(
  /<\/style/gi,
  "<\\/style",
)}\n</style>`;

// Function replacers keep `$&` and related sequences inside minified code from
// being interpreted as special String.replace substitution patterns.
html = html
  .replace(scriptMatch[0], () => inlineScript)
  .replace(styleMatch[0], () => inlineStyle);

const closingScriptTags = html.match(/<\/script>/gi) ?? [];
if (
  closingScriptTags.length !== 2 ||
  /<script[^>]+\ssrc=/i.test(html) ||
  /<link[^>]+\brel="stylesheet"/i.test(html)
) {
  throw new Error("The portable HTML contains a broken or external asset tag.");
}

await writeFile(htmlPath, html);
await rm(resolve(outputRoot, "assets"), { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(pagesRoot, "index.html"), html),
  copyFile(previewImagePath, resolve(outputRoot, "illu.png")),
  copyFile(llmsTextPath, resolve(outputRoot, "llms.txt")),
  copyFile(faviconPath, resolve(outputRoot, "favicon.png")),
  writeFile(resolve(pagesRoot, ".nojekyll"), ""),
]);

console.log("Created portable dist/index.html and GitHub Pages docs/");
