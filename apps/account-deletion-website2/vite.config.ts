import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: [
      "crypto-browserify",
      "stream-browserify",
      "buffer",
      "process/browser",
    ],
  },
  resolve: {
    alias: [
      { find: RegExp("(fp-ts)(?!/lib)"), replacement: "fp-ts/lib" },
      { find: "process", replacement: "process/browser" },
      { find: "stream", replacement: "stream-browserify" },
      { find: "zlib", replacement: "browserify-zlib" },
      { find: "util", replacement: "util" },
      { find: "node:crypto", replacement: "crypto-browserify" },
      { find: "crypto", replacement: "crypto-browserify" },
      { find: "buffer", replacement: "buffer" },
      { find: "node:buffer", replacement: "buffer" },
    ],
  },
});
