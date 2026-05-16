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
        headers: {
          // Fallback de tenant pro proxy quando a chamada não vem do axios
          // (ex.: navegação direta a /v1/auth/govbr/login). Chamadas via
          // axios são sobrescritas pelo TenantInterceptor (VITE_APP_TENANT).
          "x-tenant": process.env.VITE_APP_TENANT ?? "amtt",
        },
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
