
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

// Ensure we can access package.json in multiple locations
const packageJsonPath = fs.existsSync('./package.json') 
  ? './package.json'
  : fs.existsSync('../package.json')
    ? '../package.json'
    : '/app/package.json';

console.log('Using package.json from:', packageJsonPath);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from multiple directories
      strict: false,
      allow: [
        '/', 
        './', 
        '..', 
        '../', 
        '.', 
        '../node_modules', 
        './node_modules', 
        '/app', 
        '/app/node_modules'
      ]
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
