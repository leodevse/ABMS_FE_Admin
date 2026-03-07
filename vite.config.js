import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5174,
    proxy: {
      // Forward /building-management/** → http://localhost:8080/building-management/**
      // Backend context-path = /building-management, nên giữ nguyên prefix
      "/building-management": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
