import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { initSocket } from "./services/socket";

import { Toaster } from "react-hot-toast";

const token = localStorage.getItem("token");
if (token) initSocket(token);

if ("serviceWorker" in navigator) {
  const pwaRegisterModule = "virtual:pwa-register";

  import(/* @vite-ignore */ pwaRegisterModule)
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
      });
    })
    .catch(() => {
      // PWA registration is skipped when vite-plugin-pwa is not installed locally.
    });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,

        style: {
          borderRadius: "14px",
          background: "#0f172a",
          color: "#fff",
          padding: "14px 18px",
          fontSize: "14px",
        },

        success: {
          style: {
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          },
        },

        error: {
          style: {
            background: "#ef4444",
          },
        },
      }}
    />
  </StrictMode>,
);
