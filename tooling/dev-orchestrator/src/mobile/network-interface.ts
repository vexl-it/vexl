import {Effect} from 'effect'
import {internalIpV4} from 'internal-ip'
import * as os from 'node:os'
import * as readline from 'node:readline'
import {LanIpDetectionError} from '../errors/startup-errors.js'

interface NetworkInterface {
  name: string
  address: string
}

/**
 * Get all non-internal IPv4 network interfaces.
 */
const getAllLanInterfaces = (): NetworkInterface[] => {
  const interfaces = os.networkInterfaces()
  const result: NetworkInterface[] = []

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        result.push({name, address: addr.address})
      }
    }
  }
  return result
}

/**
 * Prompt user to select a network interface when multiple are available.
 */
const promptUserForInterface = (
  interfaces: NetworkInterface[]
): Effect.Effect<string, LanIpDetectionError> =>
  Effect.async((resume) => {
    console.log('')
    console.log('Multiple network interfaces found:')
    interfaces.forEach((iface, i) => {
      console.log(`  ${i + 1}. ${iface.name}: ${iface.address}`)
    })
    console.log('')

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('Select interface number: ', (answer) => {
      rl.close()
      const index = parseInt(answer, 10) - 1
      const selected = interfaces[index]
      if (selected) {
        resume(Effect.succeed(selected.address))
      } else {
        // Invalid selection - use first interface as fallback
        const fallback = interfaces[0]
        if (fallback) {
          console.log(
            `Invalid selection, using ${fallback.name}: ${fallback.address}`
          )
          resume(Effect.succeed(fallback.address))
        } else {
          resume(
            Effect.fail(LanIpDetectionError.make('No valid interface selected'))
          )
        }
      }
    })
  })

/**
 * Detect LAN IP address for physical device connectivity.
 *
 * Priority:
 * 1. If hostOverride provided (--host flag), use that
 * 2. If single interface found, use it
 * 3. If multiple interfaces, try internal-ip for default gateway
 * 4. If internal-ip matches an interface, use it
 * 5. Otherwise, prompt user to select
 *
 * @param hostOverride - Optional host IP from --host flag
 * @returns Effect that resolves to LAN IP address string
 */
export const detectLanIpWithPrompt = (
  hostOverride?: string
): Effect.Effect<string, LanIpDetectionError> =>
  Effect.gen(function* () {
    // If host explicitly provided, use it
    if (hostOverride) {
      return hostOverride
    }

    // Get all interfaces
    const interfaces = getAllLanInterfaces()

    if (interfaces.length === 0) {
      return yield* Effect.fail(
        LanIpDetectionError.make(
          'No LAN interfaces found - check network connection'
        )
      )
    }

    if (interfaces.length === 1) {
      // Single interface - use it directly
      const firstInterface = interfaces[0]
      if (firstInterface) {
        return firstInterface.address
      }
    }

    // Multiple interfaces - try internal-ip first (default gateway detection)
    const defaultIp = yield* Effect.tryPromise({
      try: async () => await internalIpV4(),
      catch: () => LanIpDetectionError.make('Failed to detect default gateway'),
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)))

    if (defaultIp) {
      // Check if the default IP is in our interfaces list
      const matchingInterface = interfaces.find((i) => i.address === defaultIp)
      if (matchingInterface) {
        return defaultIp
      }
    }

    // Prompt user to select
    return yield* promptUserForInterface(interfaces)
  })
