import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("recharts")) return "charts";
            if (id.includes("html2canvas") || id.includes("dompurify")) return "pdf";
            return "vendor";
          }
        }
      }
    }
  },
plugins: [react()],
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

