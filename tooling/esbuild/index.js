import esbuild from 'esbuild'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function build() {
  await esbuild
    .build({
      entryPoints: ['src/index.ts'],

      outdir: 'dist',
      bundle: true,
      platform: 'node',
      target: 'es2020',
      loader: {'.ts': 'ts'},
      sourcemap: true,
      outExtension: {'.js': '.cjs'},
      plugins: [],
    })
    .catch((e) => {
      console.error('Error while building with eslint', JSON.stringify(e))
      process.exit(1)
    })
}
