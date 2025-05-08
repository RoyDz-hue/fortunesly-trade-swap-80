
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
      // Allow serving files from the package root
      strict: false,
      allow: ['.', './node_modules']
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
  // Make sure build finds the right entry point
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    }
  },
  // Explicitly specify the project root to help with package.json location
  root: path.resolve(__dirname),
}));
