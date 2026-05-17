import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const pwaOptions = {
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.svg",
    "icons.svg",
    "pwa-192x192.svg",
    "pwa-512x512.svg",
  ],
  manifest: {
    name: "Medi-Queue",
    short_name: "MediQueue",
    description: "Hospital queue, appointments, and doctor chat in one app.",
    theme_color: "#1d4ed8",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/pwa-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
  },
  devOptions: {
    enabled: true,
  },
};

async function getPwaPlugin() {
  try {
    const { VitePWA } = await import("vite-plugin-pwa");
    return VitePWA(pwaOptions);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }

    console.warn(
      "vite-plugin-pwa is not installed locally; starting Vite without PWA support.",
    );
    return null;
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3000";
  const pwaPlugin = await getPwaPlugin();

  return {
    plugins: [
      react(),
      pwaPlugin,
    ].filter(Boolean),
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: apiTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
