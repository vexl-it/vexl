import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['utilsSrc/index.ts'],
    outfile: 'utilsDist/index.cjs',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    loader: {'.ts': 'ts'},
    sourcemap: true,
    minify: false,
  })
  .catch((e) => {
    console.error('Error while building with eslint', e)
    process.exit(1)
  })
