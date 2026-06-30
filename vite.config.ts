import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite Configuration File
 *
 * This configuration sets up the Vite build tool for the React application.
 * It handles environment variables, server settings, plugin integration (React, PWA),
 * and path aliases.
 *
 * @param {object} configEnv - The configuration environment object.
 * @param {string} configEnv.mode - The mode the app is running in (e.g., 'development', 'production').
 * @returns {import('vite').UserConfig} The Vite configuration object.
 */
export default defineConfig(({ mode }) => {
    // Load environment variables based on the current mode
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    // Set base path: '/MindFlow/' for GitHub Pages production deploy, '/' for local development
    const base = process.env.VITE_BASE_URL || (isProduction ? '/MindFlow/' : '/');

    return {
      // Sets the base path for production to /MindFlow/ (Repo Name) and / for local dev
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },

      build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          output: {
                        manualChunks: (id) => {
              if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
              if (id.includes('node_modules/jspdf') || id.includes('node_modules/pptxgenjs') || id.includes('node_modules/html2canvas') || id.includes('node_modules/jszip') || id.includes('node_modules/mammoth')) return 'vendor-export';
              if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-gfm') || id.includes('node_modules/remark-math') || id.includes('node_modules/rehype-katex') || id.includes('node_modules/katex') || id.includes('node_modules/react-syntax-highlighter')) return 'vendor-markdown';
              if (id.includes('node_modules/framer-motion')) return 'vendor-framer';
              if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons') || id.includes('node_modules/@headlessui/react')) return 'vendor-ui';
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['mindflow-icon.svg', 'sitemap.xml', 'robots.txt', 'googlef2cc72f43f58845a.html'],
          manifest: {
            name: 'MindFlow Quiz',
            short_name: 'MindFlow',
            description: 'Master subjects with adaptive quizzes and detailed explanations.',
            theme_color: '#4f46e5', // Indigo-600
            background_color: '#f9fafb', // Gray-50
            display: 'standalone',
            scope: base,
            start_url: base,
            orientation: 'portrait',
            display_override: ['standalone', 'fullscreen', 'minimal-ui'],
            icons: [
              {
                src: 'mindflow-icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 15000000
          }
        })
      ],
      define: {
        // Expose environment variables to the client-side code
        // Handles fallback logic to ensure keys are populated
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
      },
      resolve: {
        alias: {
          '@': path.resolve('./src'), // Maps '@' to the src directory for cleaner imports
        }
      }
    };
});
