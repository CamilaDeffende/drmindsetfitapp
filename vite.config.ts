import path from "path"
const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE === "1";
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  
  plugins: [
      ANALYZE_BUNDLE ? visualizer({ filename: "dist/bundle-report.html", template: "treemap", gzipSize: true, brotliSize: true }) : undefined,
react(),
        VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
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
      devOptions: { enabled: true },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/brand/mindsetfit-wordmark.png"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
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

        }
      }
    }
  },

  server: {
    host: '0.0.0.0',  // Permite acesso externo (necessário para sandbox)
    port: 8080,        // Porta padrão para preview
    cors: true,        // Habilita CORS para permitir fetch de localhost:3000
    hmr: false,        // Desabilita HMR (WebSocket) para evitar erros em sandbox
  }
})

