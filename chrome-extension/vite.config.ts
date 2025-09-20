import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "", // put files at the root so manifest paths match
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, "src/background.ts"),
        content: path.resolve(__dirname, "src/content.ts"),
        popup: path.resolve(__dirname, "src/popup/index.html")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // Put popup HTML at the root level to match manifest
          if (assetInfo.name === 'index.html' && assetInfo.source.includes('popup')) {
            return 'popup/index.html';
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  }
}); 