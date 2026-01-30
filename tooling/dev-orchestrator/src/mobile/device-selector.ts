import {Effect} from 'effect'
import {exec} from 'node:child_process'
import * as readline from 'node:readline'
import {promisify} from 'node:util'
import {ExpoStartupError} from '../errors/startup-errors.js'

const execAsync = promisify(exec)

interface Device {
  id: string
  name: string
  type: 'physical' | 'emulator' | 'simulator'
}

/**
 * Parse output from `emulator -list-avds` to get all available Android emulators.
 *
 * Example output:
 * BigRamBoiii_API_31
 * Medium_Phone_API_36
 * Pixel_5_API_32
 *
 * Each line is an AVD name, which is exactly what Expo's --device flag expects.
 */
const parseEmulatorListAvds = (output: string): Device[] => {
  const lines = output.trim().split('\n')
  const devices: Device[] = []

  for (const line of lines) {
    const avdName = line.trim()
    if (avdName === '') continue

    devices.push({
      id: avdName,
      name: avdName.replace(/_/g, ' '),
      type: 'emulator',
    })
  }

  return devices
}

/**
 * Parse physical devices from `adb devices -l` output.
 * Only returns physical devices (not emulators).
 *
 * Example output:
 * List of devices attached
 * R5CT32XXXXX            device usb:1-1 product:beyond1q model:SM_G973F device:beyond1 transport_id:2
 */
const parseAdbPhysicalDevices = (output: string): Device[] => {
  const lines = output.trim().split('\n')
  const devices: Device[] = []

  for (const line of lines) {
    // Skip header line and empty lines
    if (line.startsWith('List of devices') || line.trim() === '') continue

    // Parse device line: "device_id  status  extra_info..."
    const match = line.match(/^(\S+)\s+device\s+(.*)$/)
    if (match) {
      const adbId = match[1] ?? ''
      const info = match[2] ?? ''

      // Skip emulators - we get those from emulator -list-avds
      if (adbId.startsWith('emulator-')) continue

      // Extract model name if available
      const modelMatch = info.match(/model:(\S+)/)
      const model = modelMatch?.[1]?.replace(/_/g, ' ') ?? adbId

      devices.push({
        id: adbId,
        name: model,
        type: 'physical',
      })
    }
  }

  return devices
}

/**
 * Parse output from `xcrun simctl list devices available -j` to get iOS simulators.
 */
const parseSimctlDevices = (output: string): Device[] => {
  const devices: Device[] = []

  try {
    const data = JSON.parse(output) as {
      devices: Record<
        string,
        Array<{
          udid: string
          name: string
          state: string
          isAvailable: boolean
        }>
      >
    }

    for (const [runtime, runtimeDevices] of Object.entries(data.devices)) {
      // Only include iOS devices (not watchOS, tvOS)
      if (!runtime.includes('iOS')) continue

      for (const device of runtimeDevices) {
        if (device.isAvailable) {
          devices.push({
            id: device.udid,
            name: `${device.name} (${runtime.split('.').pop()?.replace('SimRuntime.iOS-', 'iOS ') ?? 'iOS'})`,
            type: 'simulator',
          })
        }
      }
    }
  } catch {
    // JSON parse failed, return empty list
  }

  return devices
}

/**
 * Get list of all available Android AVDs using `emulator -list-avds`.
 *
 * This shows ALL available emulators, not just running ones.
 * The AVD names are exactly what Expo's --device flag expects.
 */
const getAndroidEmulators = (): Effect.Effect<Device[], ExpoStartupError> =>
  Effect.tryPromise({
    try: async () => {
      const {stdout} = await execAsync('emulator -list-avds')
      return parseEmulatorListAvds(stdout)
    },
    catch: (error) =>
      new ExpoStartupError({
        reason: `Failed to list Android emulators: ${String(error)}`,
        remediation:
          'Ensure Android SDK is installed and emulator is in PATH. Run `emulator -list-avds` manually to check.',
      }),
  })

/**
 * Get list of connected physical Android devices using adb.
 * Returns empty array if adb fails (non-critical).
 */
const getAndroidPhysicalDevices = (): Effect.Effect<Device[], never> =>
  Effect.tryPromise({
    try: async () => {
      const {stdout} = await execAsync('adb devices -l')
      return parseAdbPhysicalDevices(stdout)
    },
    catch: () => {
      // adb not available or no devices - not critical
      return new Error('adb failed')
    },
  }).pipe(Effect.catchAll(() => Effect.succeed([])))

/**
 * Get list of available Android devices.
 *
 * Combines:
 * 1. All available AVDs from `emulator -list-avds` (shows all, not just running)
 * 2. Connected physical devices from `adb devices`
 *
 * AVD names are used directly as device IDs since that's what Expo's --device flag expects.
 */
const getAndroidDevices = (): Effect.Effect<Device[], ExpoStartupError> =>
  Effect.gen(function* () {
    // Fetch emulators and physical devices in parallel
    const [emulators, physicalDevices] = yield* Effect.all([
      getAndroidEmulators(),
      getAndroidPhysicalDevices(),
    ])

    // Physical devices first, then emulators
    return [...physicalDevices, ...emulators]
  })

/**
 * Get list of available iOS simulators using xcrun simctl.
 */
const getIosSimulators = (): Effect.Effect<Device[], ExpoStartupError> =>
  Effect.tryPromise({
    try: async () => {
      const {stdout} = await execAsync('xcrun simctl list devices available -j')
      return parseSimctlDevices(stdout)
    },
    catch: (error) =>
      new ExpoStartupError({
        reason: `Failed to list iOS simulators: ${String(error)}`,
        remediation:
          'Ensure Xcode is installed with command line tools. Run `xcrun simctl list` manually to check.',
      }),
  })

/**
 * Prompt user to select a device from the list.
 */
const promptUserForDevice = (
  devices: Device[],
  platform: 'ios' | 'android'
): Effect.Effect<string, ExpoStartupError> =>
  Effect.async((resume) => {
    console.log('')
    console.log(
      `Available ${platform === 'ios' ? 'iOS' : 'Android'} devices/simulators:`
    )
    console.log('')

    devices.forEach((device, i) => {
      const typeLabel =
        device.type === 'physical'
          ? '[device]'
          : device.type === 'emulator'
            ? '[emulator]'
            : '[simulator]'
      console.log(`  ${i + 1}. ${device.name} ${typeLabel}`)
      console.log(`     ID: ${device.id}`)
    })

    console.log('')

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('Select device number: ', (answer) => {
      rl.close()
      const index = parseInt(answer, 10) - 1
      const selected = devices[index]

      if (selected) {
        console.log('')
        console.log(`Selected: ${selected.name}`)
        resume(Effect.succeed(selected.id))
      } else {
        resume(
          Effect.fail(
            new ExpoStartupError({
              reason: 'Invalid device selection',
              remediation:
                'Please run the command again and select a valid device number.',
            })
          )
        )
      }
    })
  })

/**
 * Get list of devices for the specified platform.
 *
 * @param platform - Target platform (ios or android)
 * @returns Effect that resolves to array of available devices
 */
export const getAvailableDevices = (
  platform: 'ios' | 'android'
): Effect.Effect<Device[], ExpoStartupError> =>
  platform === 'android' ? getAndroidDevices() : getIosSimulators()

/**
 * Interactively select a device for the specified platform.
 *
 * Shows list of available devices and prompts user to select one.
 *
 * @param platform - Target platform (ios or android)
 * @returns Effect that resolves to selected device ID
 */
export const selectDeviceInteractively = (
  platform: 'ios' | 'android'
): Effect.Effect<string, ExpoStartupError> =>
  Effect.gen(function* () {
    const devices = yield* getAvailableDevices(platform)

    if (devices.length === 0) {
      return yield* Effect.fail(
        new ExpoStartupError({
          reason: `No ${platform === 'ios' ? 'iOS simulators' : 'Android devices'} found`,
          remediation:
            platform === 'ios'
              ? 'Open Xcode and create a simulator, or connect a physical device.'
              : 'Start an Android emulator or connect a physical device via USB with debugging enabled.',
        })
      )
    }

    // If only one device, use it directly
    if (devices.length === 1) {
      const device = devices[0]
      if (device) {
        console.log('')
        console.log(`Using ${device.name} (only device available)`)
        return device.id
      }
    }

    // Multiple devices - prompt user to select
    return yield* promptUserForDevice(devices, platform)
  })
