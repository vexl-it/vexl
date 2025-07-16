import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
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
    resolve: {
      alias: [
        { find: RegExp("(fp-ts)(?!/lib)"), replacement: "fp-ts/lib" },
        { find: "process", replacement: "process/browser" },
        { find: "stream", replacement: "stream-browserify" },
        { find: "zlib", replacement: "browserify-zlib" },
        { find: "util", replacement: "util" },
        { find: "buffer", replacement: "buffer" },
        { find: "node:buffer", replacement: "buffer" },
      ],
    },
    ssr: {
      noExternal: ["crypto-browserify"],
      // Ensure crypto-browserify is bundled properly
    },
  };
});
