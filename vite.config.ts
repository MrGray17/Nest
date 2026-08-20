import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/artifacts/**", "**/dist/**"]
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["nest.svg", "icons/*.png", "assets/scenes/*.jpg"],
      manifest: {
        name: "Nest",
        short_name: "Nest",
        description: "A cozy room for music, one task, and quiet focus.",
        theme_color: "#1b1c1b",
        background_color: "#1b1c1b",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/nest-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/nest-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/nest-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html"
      }
    })
  ]
});
