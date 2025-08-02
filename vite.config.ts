import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import { defineConfig, type UserConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const config: UserConfig = {
    base: './', // 使用相对路径
    plugins: [
      react(),
      runtimeErrorOverlay(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      port: 5000,
      allowedHosts: true,
    }
  };

  // 如果启用 HTTPS 或模式为 local，则启用 HTTPS
  if (process.env.HTTPS === 'true' || mode === 'dev') {
    config.server = {
      ...config.server,
      https: {
        key: await import('fs').then(fs => fs.readFileSync("key.pem")),
        cert: await import('fs').then(fs => fs.readFileSync("cert.pem")),
      },
    };
  }

  return config;
});
