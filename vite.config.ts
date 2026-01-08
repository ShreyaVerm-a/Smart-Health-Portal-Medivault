import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // pdfjs-dist@4 ships ESM that relies on top-level await; allow it in the build target.
  // If you need older browser support later, we can switch to a CDN/worker-only integration.
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
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
}));
