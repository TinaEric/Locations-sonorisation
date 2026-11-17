import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Redirige /api vers le backend en développement
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") } },
  },
});
