import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3044,
  },
  preview: {
    allowedHosts: ["shuya-app.tharapa.ai"], // Add your allowed host here
  },
});
