import path from "path"
const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE === "1";
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  
  plugins: [
      ANALYZE_BUNDLE ? visualizer({ filename: "dist/bundle-report.html", template: "treemap", gzipSize: true, brotliSize: true }) : undefined,
react()
    ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    chunkSizeWarningLimit: 1500,
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

