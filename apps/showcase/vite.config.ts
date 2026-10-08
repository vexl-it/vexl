import react from '@vitejs/plugin-react'
import {readFile} from 'node:fs/promises'
import {defineConfig, type Plugin} from 'vite'

const extensions = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
  '.json',
]

// packages/ui loads fonts and images with Metro-style `require()`, which browsers lack.
function requireAssetsAsImports(): Plugin {
  const requireCall = /require\((['"][^'"]+\.(?:otf|ttf|gif|png)['"])\)/g
  return {
    name: 'require-assets-as-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/packages/ui/src/')) return undefined
      const imports: string[] = []
      const transformed = code.replace(requireCall, (_, path: string) => {
        const name = `__asset${imports.length}`
        imports.push(`import ${name} from ${path}`)
        return name
      })
      if (imports.length === 0) return undefined
      return {code: `${imports.join('\n')}\n${transformed}`, map: null}
    },
  }
}

// Reanimated passes its internal `forwardedRef` prop on to the wrapped component, and Tamagui
// components forward unknown props to the DOM, so React warns. Drop it before rendering.
const animatedComponentFile =
  /react-native-reanimated\/lib\/module\/css\/component\/AnimatedComponent\.js$/
const childPropsSpread = '...(props ?? this.props),'

function omitForwardedRef(code: string): string {
  if (!code.includes(childPropsSpread)) {
    throw new Error('Update omitForwardedRef for this Reanimated version')
  }
  return code.replace(
    childPropsSpread,
    '...Object.fromEntries(Object.entries(props ?? this.props).filter(([key]) => key !== "forwardedRef")),'
  )
}

const omitForwardedRefPlugin: Plugin = {
  name: 'omit-reanimated-forwarded-ref',
  transform: (code, id) =>
    animatedComponentFile.test(id) ? omitForwardedRef(code) : undefined,
}

export default defineConfig(({mode}) => ({
  plugins: [
    requireAssetsAsImports(),
    omitForwardedRefPlugin,
    react({babel: {plugins: ['react-native-worklets/plugin']}}),
  ],
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
    global: 'globalThis',
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
    'process.env.EXPO_OS': JSON.stringify('web'),
  },
  resolve: {
    extensions,
    dedupe: ['react', 'react-dom', 'react-native-web'],
    alias: [{find: /^react-native$/, replacement: 'react-native-web'}],
  },
  // Reanimated's web build reaches react-native-web internals through `require()` inside ES modules.
  build: {commonjsOptions: {transformMixedEsModules: true}},
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      loader: {'.js': 'jsx'},
      plugins: [
        {
          name: omitForwardedRefPlugin.name,
          setup: (build) => {
            build.onLoad({filter: animatedComponentFile}, async ({path}) => ({
              contents: omitForwardedRef(await readFile(path, 'utf8')),
              loader: 'jsx',
            }))
          },
        },
      ],
    },
  },
}))
