import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { getAsset, isSea } from "node:sea";

const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const RUN_VALUE = "THEBOX Engine";

export function isStandaloneExecutable(
  executable = process.execPath,
  platform = process.platform,
  sea = isSea()
) {
  if (platform !== "win32") return false;
  if (sea) return true;
  const name = basename(executable).toLowerCase();
  return name !== "node.exe" && name !== "node";
}

export function buildStartupCommand(executable = process.execPath) {
  return '"' + executable + '" --startup --no-open';
}

export function readAutoStart({ platform = process.platform, execFileSyncImpl = execFileSync } = {}) {
  if (platform !== "win32") return false;
  try {
    const output = execFileSyncImpl("reg.exe", ["query", RUN_KEY, "/v", RUN_VALUE], {
      encoding: "utf8",
      windowsHide: true,
    });
    return output.includes(RUN_VALUE);
  } catch {
    return false;
  }
}

export function setAutoStart(enabled, {
  executable = process.execPath,
  platform = process.platform,
  execFileSyncImpl = execFileSync,
} = {}) {
  if (platform !== "win32") throw new Error("Inicializacao automatica disponivel apenas no Windows.");
  if (!isStandaloneExecutable(executable, platform)) {
    throw new Error("Inicializacao automatica so pode ser alterada pelo executavel empacotado.");
  }
  const args = enabled
    ? ["add", RUN_KEY, "/v", RUN_VALUE, "/t", "REG_SZ", "/d", buildStartupCommand(executable), "/f"]
    : ["delete", RUN_KEY, "/v", RUN_VALUE, "/f"];
  execFileSyncImpl("reg.exe", args, { windowsHide: true, stdio: "ignore" });
  return enabled;
}

function getPanelScript() {
  if (isSea()) return Buffer.from(getAsset("control-panel.ps1")).toString("utf8");
  const entryDir = dirname(resolve(process.argv[1] || process.cwd()));
  return readFileSync(join(entryDir, "control-panel.ps1"), "utf8");
}

export function launchControlPanel({
  enabled = true,
  autoStart = false,
  startHidden = false,
  port = 7421,
  onCommand = () => {},
  spawnImpl = spawn,
} = {}) {
  if (process.platform !== "win32") return null;
  const runtimeDir = join(tmpdir(), "thebox-engine");
  const scriptPath = join(runtimeDir, "control-panel.ps1");
  mkdirSync(runtimeDir, { recursive: true });
  const script = getPanelScript();
  if (!existsSync(scriptPath) || readFileSync(scriptPath, "utf8") !== script) {
    writeFileSync(scriptPath, script, "utf8");
  }
  const child = spawnImpl("powershell.exe", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-File", scriptPath,
    "-Enabled", enabled ? "1" : "0",
    "-AutoStart", autoStart ? "1" : "0",
    "-CanAutoStart", isStandaloneExecutable() ? "1" : "0",
    "-StartHidden", startHidden ? "1" : "0",
    "-Port", String(port),
  ], { stdio: ["ignore", "pipe", "pipe"] });
  createInterface({ input: child.stdout }).on("line", (line) => onCommand(line.trim()));
  child.stderr.on("data", (chunk) => {
    const message = chunk.toString().trim();
    if (message) console.warn("Painel do motor:", message);
  });
  return child;
}
