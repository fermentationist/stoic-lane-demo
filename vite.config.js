import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/;

export const DEV_SERVER_PORT = 3000;
export const API_SERVER_PORT = 4000;
export const PROD_URL = "https://stoic.onrender.com";

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react()],
    build: {
      outDir: "./build",
      sourceMap: true
    },
    server: {
      cors: true,
      port: DEV_SERVER_PORT,
      proxy: {
        "/api": {
          target: `http://localhost:${API_SERVER_PORT}/`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
