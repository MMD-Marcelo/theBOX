// Empacota o engine como binario unico (Node SEA).
// Etapas: bundle ESM->CJS (esbuild) -> blob SEA -> injeta no node (postject).
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const isWin = process.platform === "win32";
const outName = process.env.THEBOX_ENGINE_OUTPUT || (isWin ? "thebox-downloader.exe" : "thebox-downloader");
const outPath = join(dist, outName);

mkdirSync(dist, { recursive: true });

console.log("1/5 bundle do motor ESM -> CJS (esbuild)...");
await build({
  entryPoints: [join(root, "src", "index.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: join(dist, "bundle.cjs"),
});

console.log("2/5 bundle do worker OCR...");
await build({
  entryPoints: [join(root, "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: join(dist, "tesseract-worker.cjs"),
});

console.log("3/5 gerando blob SEA...");
execFileSync(process.execPath, ["--experimental-sea-config", join(root, "sea-config.json")], {
  stdio: "inherit",
  cwd: root,
});

console.log("4/5 copiando binario do node...");
copyFileSync(process.execPath, outPath);

console.log("5/5 injetando blob (postject)...");
const postjectCli = join(root, "node_modules", "postject", "dist", "cli.js");
const args = [
  postjectCli,
  outPath,
  "NODE_SEA_BLOB",
  join(dist, "sea-prep.blob"),
  "--sentinel-fuse",
  "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
];
if (process.platform === "darwin") args.push("--macho-segment-name", "NODE_SEA");
execFileSync(process.execPath, args, { stdio: "inherit", cwd: root });
if (!isWin) chmodSync(outPath, 0o755);

console.log(`\nOK -> ${outPath}`);
console.log("Abra o executavel para controlar o motor pela janela do Windows.");
