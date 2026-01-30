// Existing exports
export {
  generateLocalEnvPreset,
  getHostForPlatform,
} from './env-preset-generator.js'
export type {MobilePlatform} from './env-preset-generator.js'

// Keep backward-compatible export
export {buildExpoPublicEnvVars, startExpoDevServer} from './expo-runner.js'

// New exports for dev:mobile
export {
  runNativeBuild,
  runPrebuildThenNative,
  startExpoWithMode,
} from './expo-runner.js'
export type {BuildMode, MobileCommandConfig} from './expo-runner.js'

// New modules from Plan 02
export {detectLanIpWithPrompt} from './network-interface.js'
export {findAvailableMetroPort} from './port-allocator.js'

// Device selection
export {selectDeviceInteractively} from './device-selector.js'
