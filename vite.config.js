import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
  },
  base: "/samples/", // Set base to match GitHub Pages repository name
});
