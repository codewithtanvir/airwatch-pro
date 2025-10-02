import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // PWA Build Optimizations
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React and React DOM
          react: ['react', 'react-dom'],
          // Radix UI components
          radix: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          // Charts and data visualization
          charts: ['recharts'],
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utility libraries
          utils: ['class-variance-authority', 'clsx', 'tailwind-merge', 'date-fns', 'uuid'],
          // Icons
          icons: ['lucide-react']
        },
        // Optimize for PWA caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  // PWA Specific Configurations
  server: {
    fs: {
      // Allow serving files from project root for service worker
      allow: ['..']
    }
  },
  // Optimize for production PWA
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  },
  // Enable compression for better PWA performance
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.PWA_ENABLED': JSON.stringify(true)
  }
}));
