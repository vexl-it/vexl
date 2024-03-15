import {vitePlugin as remix} from '@remix-run/dev'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [remix()],
  define: {
    global: {},
    // "process": {},
  },
  // resolve: {
  //   alias: [
  //     {
  //       find: "node:crypto",
  //       replacement: "crypto-browserify",
  //     },
  //     {
  //       find: "crypto",
  //       replacement: "crypto-browserify",
  //     },
  //     {
  //       find: "strem",
  //       replacement: "stream-browserify",
  //     },
  //   ],
  // },
  resolve: {
    alias: [
      {find: RegExp('(fp-ts)(?!/lib)'), replacement: 'fp-ts/lib'},
      {find: 'process', replacement: 'process/browser'},
      {find: 'stream', replacement: 'stream-browserify'},
      {find: 'zlib', replacement: 'browserify-zlib'},
      {find: 'util', replacement: 'util'},
      {find: 'node:crypto', replacement: 'crypto-browserify'},
      {find: 'crypto', replacement: 'crypto-browserify'},
      {find: 'buffer', replacement: 'buffer'},
      {find: 'node:buffer', replacement: 'buffer'},
    ],
  },
})
