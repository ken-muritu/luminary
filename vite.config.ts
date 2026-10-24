import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

const bibleAssetsDir = path.resolve(__dirname, "legacy/v2/main/assets/bible");

function bibleDataDevPlugin(): Plugin {
  return {
    name: "bible-data-dev",
    configureServer(server) {
      server.middlewares.use("/bible-data", (req, res, next) => {
        const name = path.basename(req.url ?? "").split("?")[0];
        if (!name.endsWith(".json") && !name.endsWith(".import.sql")) return next();

        const publicFile = path.resolve(__dirname, "public/bible-data", name);
        if (fs.existsSync(publicFile)) {
          res.setHeader("Content-Type", name.endsWith(".json") ? "application/json" : "text/plain");
          fs.createReadStream(publicFile).pipe(res);
          return;
        }

        if (!name.endsWith(".json")) return next();
        const file = path.join(bibleAssetsDir, name);
        if (!fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    bibleDataDevPlugin(),
    viteStaticCopy({
      targets: [{ src: "legacy/v2/main/assets/bible/*.json", dest: "bible-data" }],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "luminary-icon.svg",
        "pwa-icon-192.png",
        "pwa-icon-512.png",
        "apple-touch-icon.png",
        "favicon-32.png",
        "favicon.ico",
        "manifest.json",
      ],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^\/bible-data\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "bible-data" },
          },
          {
            urlPattern: /^\/models\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "ai-models" },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    // Turso's /vite export uses top-level await + module workers; pre-bundling breaks initThreadPool.
    exclude: [
      "@xenova/transformers",
      "@tursodatabase/database-wasm",
      "@tursodatabase/database-wasm-common",
      "@tursodatabase/database-common",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        output: path.resolve(__dirname, "public/output.html"),
      },
    },
  },
});
