import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3456,
  },
  resolve: {
    // Dedupe React to prevent multiple copies
    dedupe: ["react", "react-dom"],
    alias: {
      // Force playground to use its own React
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),

      // Resolve Panda CSS imports to playground's styled-system
      // This allows qstd's runtime css() calls to use playground's Panda
      "panda/css": path.resolve(__dirname, "./styled-system/css/index.mjs"),
      "panda/jsx": path.resolve(__dirname, "./styled-system/jsx/index.mjs"),
      "panda/patterns": path.resolve(
        __dirname,
        "./styled-system/patterns/index.mjs"
      ),
      "panda/tokens": path.resolve(
        __dirname,
        "./styled-system/tokens/index.mjs"
      ),
    },
  },
});
