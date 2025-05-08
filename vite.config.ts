
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from multiple directories including parent dirs
      strict: false,
      allow: ['/', './', '..', '../', '.', '../node_modules', './node_modules', '/dev-server']
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Set base to current directory to avoid path issues
  base: './',
  // Ensure environment variables are properly passed
  define: {
    'process.env': process.env
  },
  // Make sure build finds the right entry point and path
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    }
  },
  // Use absolute path for project root and include alternative locations
  root: process.cwd(),
  // Help Vite find the package.json in various locations
  cacheDir: path.resolve(process.cwd(), 'node_modules/.vite')
}));
