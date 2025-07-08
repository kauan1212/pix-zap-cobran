import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import manifest from './public/manifest.json' assert { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: manifest.name,
        short_name: manifest.short_name,
        description: manifest.description,
        start_url: manifest.start_url,
        scope: manifest.scope,
        display: 'standalone' as const,
        background_color: manifest.background_color,
        theme_color: manifest.theme_color,
        orientation: 'portrait-primary' as const,
        icons: manifest.icons
      },
      includeAssets: ['favicon.ico', 'logo-192.png', 'logo-512.png', 'logo-maskable.png'],
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
