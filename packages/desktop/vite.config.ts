import { defineConfig } from 'vite';

const tauriDevHost = process.env.TAURI_DEV_HOST;
const tauriDebug = !!process.env.TAURI_ENV_DEBUG;

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    ...(tauriDevHost
      ? {
          host: tauriDevHost,
          hmr: {
            protocol: 'ws',
            host: tauriDevHost,
            port: 5174,
          },
        }
      : {}),
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: 'es2022',
    minify: tauriDebug ? false : 'esbuild',
    sourcemap: tauriDebug,
  },
});
