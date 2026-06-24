import { describe, it, expect } from "vitest";
import { EventEmitter } from "node:events";
import { createRegistry } from "./jobs.js";

// Fake child process controlavel.
function makeFakeProc() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.killed = false;
  proc.kill = () => {
    proc.killed = true;
    proc.emit("close", null);
  };
  return proc;
}

function setup() {
  let lastProc;
  const spawnImpl = () => {
    lastProc = makeFakeProc();
    return lastProc;
  };
  const registry = createRegistry({ spawnImpl, ytdlpPath: "yt-dlp", outDir: "/out" });
  return { registry, getProc: () => lastProc };
}

describe("createRegistry", () => {
  it("inicia job em estado downloading", () => {
    const { registry } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    expect(registry.get(id).status).toBe("downloading");
  });

  it("atualiza progresso ao receber linha do stdout", () => {
    const { registry, getProc } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    getProc().stdout.emit("data", Buffer.from("[download]  42.0% of 10MiB at 1MiB/s ETA 00:09\n"));
    expect(registry.get(id).percent).toBe(42);
  });

  it("marca done quando processo encerra com codigo 0", () => {
    const { registry, getProc } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    getProc().emit("close", 0);
    expect(registry.get(id).status).toBe("done");
    expect(registry.get(id).percent).toBe(100);
  });

  it("marca error quando processo encerra com codigo != 0", () => {
    const { registry, getProc } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    getProc().stderr.emit("data", Buffer.from("ERROR: video indisponivel"));
    getProc().emit("close", 1);
    expect(registry.get(id).status).toBe("error");
    expect(registry.get(id).error).toContain("indisponivel");
  });

  it("notifica assinantes (SSE) nas mudancas", () => {
    const { registry, getProc } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    const seen = [];
    registry.subscribe(id, (snap) => seen.push(snap));
    getProc().stdout.emit("data", Buffer.from("[download]  10.0% of 1MiB\n"));
    getProc().emit("close", 0);
    expect(seen.map((s) => s.percent)).toContain(10);
    expect(seen.map((s) => s.status)).toContain("done");
  });

  it("startDirect: progride e conclui", async () => {
    let resolveDl;
    const directImpl = ({ onProgress }) =>
      new Promise((resolve) => {
        onProgress(30);
        resolveDl = resolve;
      });
    const registry = createRegistry({ directImpl, outDir: "/out" });
    const id = registry.startDirect({ url: "https://x/a.zip" });
    expect(registry.get(id).percent).toBe(30);
    resolveDl();
    await new Promise((r) => setTimeout(r, 0));
    expect(registry.get(id).status).toBe("done");
  });

  it("startDirect: erro vira status error", async () => {
    const directImpl = () => Promise.reject(new Error("HTTP 404"));
    const registry = createRegistry({ directImpl, outDir: "/out" });
    const id = registry.startDirect({ url: "https://x/a.zip" });
    await new Promise((r) => setTimeout(r, 0));
    expect(registry.get(id).status).toBe("error");
    expect(registry.get(id).error).toContain("404");
  });

  it("startConvert: usa duracao do stderr e progride pelo out_time", () => {
    const { registry, getProc } = setup();
    const id = registry.startConvert({ inputPath: "/tmp/in.mov", outputName: "out.mp4", format: "mp4" });
    getProc().stderr.emit("data", Buffer.from("  Duration: 00:00:10.00, start: 0.0\n"));
    getProc().stdout.emit("data", Buffer.from("out_time=00:00:05.00\n"));
    expect(registry.get(id).percent).toBe(50);
    getProc().emit("close", 0);
    expect(registry.get(id).status).toBe("done");
  });

  it("cancel mata o processo e marca canceled", () => {
    const { registry } = setup();
    const id = registry.start({ url: "U", output: "mp4" });
    registry.cancel(id);
    expect(registry.get(id).status).toBe("canceled");
  });
});
