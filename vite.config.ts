import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // Relative assets work on both user and project GitHub Pages URLs.
  base: "./",
  plugins: [
    {
      name: "social-preview-url",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const siteUrl = (process.env.VITE_SITE_URL || ".").replace(/\/$/, "");
          return html.replaceAll("%VITE_SITE_URL%", siteUrl);
        },
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      // This build embeds the decoder worker, allowing the portable HTML file
      // to read uploaded QR images without loading an extra JavaScript chunk.
      "qr-scanner": fileURLToPath(
        new URL(
          "./node_modules/qr-scanner/qr-scanner.legacy.min.js",
          import.meta.url,
        ),
      ),
    },
  },
});
