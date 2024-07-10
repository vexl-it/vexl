import {device} from 'detox'
import {resolveConfig} from 'detox/internals'

const platform = device.getPlatform()

const sleep = (t: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, t))
}

function getExpoDeepLinkUrl(): string {
  const expoLauncherUrl = encodeURIComponent(
    `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`
  )

  return `exp+vexl://expo-development-client/?url=${expoLauncherUrl}`
}

async function openExpoDevClientApp(
  config: Detox.DeviceLaunchAppConfig
): Promise<void> {
  const deepLinkUrl = getExpoDeepLinkUrl()

  if (platform === 'ios') {
    await device.launchApp(config)
    await sleep(3000)
    await device.openURL({
      url: deepLinkUrl,
    })
  } else {
    await device.launchApp({
      ...config,
      url: deepLinkUrl,
    })
  }

  await sleep(3000)
}

async function isDebugTestBuild(): Promise<boolean> {
  const {configurationName} = await resolveConfig()

  const isDebugBuild = configurationName.split('.')[2] === 'debug'

  return isDebugBuild
}

// Inspired by Expo E2E detox-tests guide:
// See more: https://docs.expo.dev/build-reference/e2e-tests/#e2eutilsopenappjs-new-file
export async function openApp(
  config: Detox.DeviceLaunchAppConfig
): Promise<void> {
  if (await isDebugTestBuild()) {
    await openExpoDevClientApp(config)
  } else {
    await device.launchApp(config)
  }
}

export async function restartApp(): Promise<void> {
  if (await isDebugTestBuild()) {
    await device.reloadReactNative()
  } else {
    await device.terminateApp()
    await openApp({newInstance: false})
  }
}
