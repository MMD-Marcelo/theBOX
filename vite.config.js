import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  base: "./",
  plugins: [react(), wasm()],
  build: {
    target: "esnext",
  },
  worker: {
    plugins: () => [wasm()],
  },
});
