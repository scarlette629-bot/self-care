import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const base = process.env.VITE_BASE_PATH || "/";
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          react: ["react", "react-dom", "react-router-dom"],
          data: ["dexie", "zod", "zustand"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["logo.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "SELF-CARE 個人健康管理",
        short_name: "SELF-CARE",
        description: "記錄健康，看見自己的變化",
        theme_color: "#0f8585",
        background_color: "#f0f7f7",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: base + "icon-192.png?v=0.1", sizes: "192x192", type: "image/png" },
          {
            src: base + "icon-512.png?v=0.1",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: base + "index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
    }),
  ],
});
