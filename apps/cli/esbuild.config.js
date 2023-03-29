const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/cli.ts'],
    outfile: 'dist/cli.js',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    loader: {'.ts': 'ts'},
    sourcemap: true,
  })
  .catch(() => process.exit(1))
