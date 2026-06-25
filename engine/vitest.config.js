import { defineConfig } from "vitest/config";

// Config proprio do motor: impede o vitest de subir e carregar o
// vite.config.js da raiz (que depende de pacotes nao instalados em engine/).
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ["src/**/*.test.js"],
  },
});
