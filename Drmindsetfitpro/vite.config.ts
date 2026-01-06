import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',  // Permite acesso externo (necessário para sandbox)
    port: 8080,        // Porta padrão para preview
    cors: true,        // Habilita CORS para permitir fetch de localhost:3000
    hmr: false,        // Desabilita HMR (WebSocket) para evitar erros em sandbox
  }
})

