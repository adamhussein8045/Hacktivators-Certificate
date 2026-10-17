import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {siteGatePlugin} from './server/vite-site-gate';

export default defineConfig(({mode}) => {
  // Loaded server-side only; non-VITE_ variables are never exposed to the client bundle.
  const env = {...loadEnv(mode, process.cwd(), ''), ...process.env};
  return {
    plugins: [
      siteGatePlugin({
        password: env.SITE_PASSWORD,
        sessionSecret: env.SITE_SESSION_SECRET,
        embedded: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
