// Registro de jobs de download. Cada job acompanha um processo yt-dlp,
// faz parse do progresso e notifica assinantes (para SSE).
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { parseProgress, buildDownloadArgs } from "./youtube.js";
import { buildConvertArgs, parseDuration, parseProgressTime, percentFrom } from "./media.js";

// Acha o arquivo final numa pasta de download (ignora parciais), pega o maior.
function pickLargestFile(dir) {
  try {
    const files = readdirSync(dir).filter((f) => !/\.(part|ytdl|temp)$/i.test(f));
    if (!files.length) return null;
    return files
      .map((f) => join(dir, f))
      .sort((a, b) => statSync(b).size - statSync(a).size)[0];
  } catch {
    return null;
  }
}

export function createRegistry({ spawnImpl, ytdlpPath, ffmpegPath, outDir, directImpl, cleanup }) {
  const jobs = new Map();
  const subscribers = new Map();

  function notify(id) {
    const job = jobs.get(id);
    const list = subscribers.get(id) || [];
    for (const cb of list) cb(snapshot(job));
  }

  function snapshot(job) {
    return {
      id: job.id,
      status: job.status,
      percent: job.percent,
      speed: job.speed,
      eta: job.eta,
      error: job.error,
    };
  }

  function start({ url, formatId, output }) {
    const id = randomUUID();
    const job = {
      id,
      status: "downloading",
      percent: 0,
      speed: null,
      eta: null,
      error: null,
      stderr: "",
      proc: null,
    };
    jobs.set(id, job);

    // Cada download vai para uma pasta propria; achamos o arquivo por listagem
    // (robusto a qualquer nome, incluindo emojis/acentos).
    const jobDir = join(outDir, ".thebox-tmp", id);
    try {
      mkdirSync(jobDir, { recursive: true });
    } catch {
      /* tests/fs */
    }
    const args = buildDownloadArgs({ url, formatId, output, outDir: jobDir });
    const proc = spawnImpl(ytdlpPath, args);
    job.proc = proc;

    const onLine = (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        const p = parseProgress(line);
        if (p) {
          job.percent = p.percent;
          job.speed = p.speed;
          job.eta = p.eta;
          notify(id);
        }
      }
    };
    proc.stdout.on("data", onLine);
    proc.stderr.on("data", (chunk) => {
      job.stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (job.status === "canceled") return;
      if (code === 0) {
        job.status = "done";
        job.percent = 100;
        job.outputPath = pickLargestFile(jobDir);
      } else {
        job.status = "error";
        job.error = (job.stderr.trim().split(/\r?\n/).pop() || "Falha no download.").replace(/^ERROR:\s*/, "");
      }
      notify(id);
    });

    return id;
  }

  function startDirect({ url }) {
    const id = randomUUID();
    const job = { id, status: "downloading", percent: 0, speed: null, eta: null, error: null };
    jobs.set(id, job);
    Promise.resolve(
      directImpl({
        url,
        outDir,
        onProgress: (percent) => {
          job.percent = percent;
          notify(id);
        },
      })
    )
      .then((name) => {
        job.status = "done";
        job.percent = 100;
        if (name) job.outputPath = join(outDir, name);
        notify(id);
      })
      .catch((error) => {
        job.status = "error";
        job.error = error.message;
        notify(id);
      });
    return id;
  }

  function startConvert({ inputPath, outputName, format, bitrate }) {
    const id = randomUUID();
    const job = { id, status: "downloading", percent: 0, speed: null, eta: null, error: null, duration: null, stderr: "" };
    jobs.set(id, job);

    const output = join(outDir, outputName);
    const args = buildConvertArgs({ input: inputPath, output, format, bitrate });
    const proc = spawnImpl(ffmpegPath, args);
    job.proc = proc;

    proc.stdout.on("data", (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        const t = parseProgressTime(line);
        if (t != null) {
          const pct = percentFrom(t, job.duration);
          if (pct != null) {
            job.percent = pct;
            notify(id);
          }
        }
      }
    });
    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      job.stderr += text;
      if (job.duration == null) {
        const d = parseDuration(text);
        if (d != null) job.duration = d;
      }
    });
    proc.on("close", (code) => {
      if (job.status === "canceled") return;
      if (code === 0) {
        job.status = "done";
        job.percent = 100;
        job.outputPath = output;
      } else {
        job.status = "error";
        job.error = (job.stderr.trim().split(/\r?\n/).pop() || "Falha na conversao.").slice(0, 200);
      }
      if (cleanup) cleanup(inputPath);
      notify(id);
    });

    return id;
  }

  function get(id) {
    const job = jobs.get(id);
    return job ? snapshot(job) : null;
  }

  function subscribe(id, cb) {
    if (!subscribers.has(id)) subscribers.set(id, []);
    subscribers.get(id).push(cb);
    return () => {
      const list = subscribers.get(id) || [];
      subscribers.set(id, list.filter((fn) => fn !== cb));
    };
  }

  function cancel(id) {
    const job = jobs.get(id);
    if (!job) return false;
    job.status = "canceled";
    if (job.proc && !job.proc.killed) job.proc.kill();
    notify(id);
    return true;
  }

  function filePath(id) {
    return jobs.get(id)?.outputPath || null;
  }

  return { start, startDirect, startConvert, get, filePath, subscribe, cancel, list: () => [...jobs.keys()] };
}
