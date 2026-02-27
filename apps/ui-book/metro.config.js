// Learn more https://docs.expo.dev/guides/monorepos
const {getDefaultConfig} = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Force a single copy of React across all workspace packages to prevent
// "Invalid hook call" errors from duplicate React instances.
const appModules = path.resolve(projectRoot, 'node_modules')
const defaultResolveRequest = config.resolver.resolveRequest
const pinnedPackages = [
  'react',
  'react-native',
  'react-native-reanimated',
  'react-native-svg',
]
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pinnedMatch = pinnedPackages.find(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/')
  )
  if (pinnedMatch) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, {paths: [appModules]}),
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
