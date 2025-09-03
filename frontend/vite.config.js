import {defineConfig, preview} from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: ['servit-frontend-bfd2b4fjg8ayc2fn.southeastasia-01.azurewebsites.net']
  },
  define: {
    global: 'window',
  }
});