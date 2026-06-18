import esbuild from 'esbuild'

// Bundle only our own TypeScript: the service entrypoint plus the @vexl-next/*
// workspace packages, which are consumed as raw source with no build step. Everything
// else (third-party npm deps and Node builtins) is left external and resolved from
// node_modules at runtime. The Docker images already ship node_modules, so this keeps
// the output tiny (just our code) and avoids bundling native / dynamic-require /
// ESM-only deps incorrectly.
/** @type {import('esbuild').Plugin} */
const bundleWorkspaceOnly = {
  name: 'bundle-workspace-only',
  setup(build) {
    build.onResolve({filter: /.*/}, (args) => {
      if (args.kind === 'entry-point') return null
      if (args.path.startsWith('.')) return null // relative imports -> bundle
      if (args.path.startsWith('@vexl-next/')) return null // workspace source -> bundle
      return {path: args.path, external: true} // npm deps + node builtins -> external
    })
  },
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ['src/index.ts'],
      outdir: 'dist',
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node24',
      sourcemap: true,
      plugins: [bundleWorkspaceOnly],
    })

    if (result.warnings.length > 0) {
      console.warn(
        esbuild
          .formatMessagesSync(result.warnings, {kind: 'warning', color: true})
          .join('\n')
      )
    }
  } catch (error) {
    // esbuild rejects with a BuildFailure whose `errors` are structured messages.
    if (
      typeof error === 'object' &&
      error !== null &&
      'errors' in error &&
      Array.isArray(error.errors)
    ) {
      console.error(
        esbuild
          .formatMessagesSync(error.errors, {kind: 'error', color: true})
          .join('\n')
      )
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}
