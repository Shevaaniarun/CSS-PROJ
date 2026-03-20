import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      hooks: fileURLToPath(new URL("./src/hooks", import.meta.url)),
      lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts"
  },
  server: {
    port: 3000
  }
});
