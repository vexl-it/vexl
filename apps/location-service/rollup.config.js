import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.ts', // Your TypeScript entry file
  output: {
    file: 'dist/index.js', // The output bundled file
    format: 'es', // The output format
  },
  plugins: [
    typescript(), // Use the TypeScript plugin to transpile your code
    resolve({preferBuiltins: true}), // Resolve dependencies from node_modules
    json(),
    commonjs(), // Convert CommonJS modules to ES modules
    terser({format: {beautify: true}}), // Minify and beautify the output code
  ],
  external: [], // You can list any external dependencies here, if you want to exclude them from the bundle
}
