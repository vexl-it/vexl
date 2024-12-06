// Learn more https://docs.expo.dev/guides/monorepos
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const path = require('path')

// Find the project and workspace directories
const projectRoot = __dirname
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getSentryExpoConfig(projectRoot)

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot]
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto' || moduleName === 'node:crypto') {
    // return require.resolve(path.resolve(projectRoot, 'merged-crypto'))

    return {
      filePath: path.resolve(projectRoot, 'merged-crypto.js'),
      type: 'sourceFile',
    }
    // return require.resolve(path.resolve(projectRoot, 'merged-crypto'))
  }

  if (moduleName === 'stream') {
    return context.resolveRequest(context, 'stream-browserify', platform)
  }

  // if (moduleName === 'buffer' || moduleName === 'node:buffer') {
  //   return context.resolveRequest(
  //     context,
  //     '@craftzdog/react-native-buffer',
  //     platform
  //   )
  // }

  // if (moduleName === 'brorand') {
  //   return context.resolveRequest(
  //     context,
  //     '@vexl-next/fix-brorand-for-expo',
  //     platform
  //   )
  // }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
