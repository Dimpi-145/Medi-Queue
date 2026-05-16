import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://medi-queue-1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
