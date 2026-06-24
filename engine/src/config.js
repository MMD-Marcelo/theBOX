// Configuracao a partir de argumentos de linha de comando.
import { join } from "node:path";
import { homedir } from "node:os";

export const DEFAULT_PORT = 7421;
// Site que o motor abre no navegador (auto-handshake). GitHub Pages por padrao.
export const DEFAULT_SITE_URL = "https://mmd-marcelo.github.io/theBOX/";

// Origens permitidas a falar com o motor (allowlist de CORS/Origin).
export const ALLOWED_ORIGINS = [
  "https://mmd-marcelo.github.io",
  "https://thebox.tche.studio",
  "http://localhost:5173",
  "http://localhost:5190",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5190",
];

export function parseArgs(argv, home = homedir()) {
  const cfg = {
    port: DEFAULT_PORT,
    outDir: join(home, "Downloads", "THEBOX"),
    siteUrl: DEFAULT_SITE_URL,
    open: true,
    startup: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--port" && argv[i + 1]) cfg.port = Number(argv[++i]);
    else if (argv[i] === "--out" && argv[i + 1]) cfg.outDir = argv[++i];
    else if (argv[i] === "--url" && argv[i + 1]) cfg.siteUrl = argv[++i];
    else if (argv[i] === "--no-open") cfg.open = false;
    else if (argv[i] === "--startup") {
      cfg.startup = true;
      cfg.open = false;
    }
  }
  return cfg;
}
