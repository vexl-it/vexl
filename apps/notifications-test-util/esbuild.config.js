const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    loader: {'.ts': 'ts'},
    sourcemap: true,
    minify: true,
  })
  .catch((e) => {
    console.error('Error while building with eslint', e)
    process.exit(1)
  })
