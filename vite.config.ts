import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE === "1";

export default defineConfig(() => {
  // Quando estiver buildando para Capacitor (Android/iOS),
  // desativamos o PWA (Service Worker/Workbox), porque pode quebrar o WebView
  // e causar "bad-precaching-response" e tela preta.
  const IS_CAPACITOR = process.env.VITE_CAPACITOR === "1";

  return {
    // IMPORTANTÍSSIMO para WebView/Capacitor: assets relativos
    base: "./",

    plugins: [
      ANALYZE_BUNDLE
        ? visualizer({
            filename: "dist/bundle-report.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
          })
        : undefined,

      react(),

      // Só ativa PWA no navegador (web). No Capacitor, desativado.
      !IS_CAPACITOR
        ? VitePWA({
            registerType: "autoUpdate",
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            injectRegister: null,
            includeAssets: ["pwa-192.png", "pwa-512.png"],
            manifest: {
              name: "MindsetFit",
              short_name: "MindsetFit",
              description: "Plataforma premium de treino e nutrição",
              theme_color: "#0B0F1A",
              background_color: "#0B0F1A",
              display: "standalone",
              start_url: "/",
              icons: [
                { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
                { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
              ],
            },
            devOptions: { enabled: false },
            injectManifest: {
              globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
              globIgnores: ["**/*.zip", "**/*backup*.*", "**/*.backup-*.png"],
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            },
          })
        : undefined,
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            pdf: ["jspdf", "html2canvas", "dompurify"],
          },
        },
      },
    },

    server: {
      watch: { ignored: ["**/.backups/**"] },
      host: "0.0.0.0",
      port: 8080,
      cors: true,
      hmr: false,
    },
  };
});