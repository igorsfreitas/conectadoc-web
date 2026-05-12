import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: { APP_VERSION: JSON.stringify(process.env.npm_package_version) },
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "cert/localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "cert/localhost.pem")),
    },
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
      },
    },
  },
  build: {
    minify: true,
    sourcemap: false,
    rollupOptions: {
      treeshake: true,
      output: {
        entryFileNames: `assets/index.js`,
        chunkFileNames: `assets/index-chunk.js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
