import {Array, Option, pipe} from 'effect'
import {networkInterfaces} from 'node:os'

// Prefer the conventional primary interfaces (macOS Wi-Fi/Ethernet, Linux).
const PREFERRED_INTERFACES = ['en0', 'en1', 'eth0', 'wlan0']

/** The machine's LAN IPv4, reachable from simulators, emulators and devices. */
export function detectLanIp(): Option.Option<string> {
  const candidates = pipe(
    Object.entries(networkInterfaces()),
    Array.flatMap(([name, addresses]) =>
      pipe(
        addresses ?? [],
        Array.filter(
          (address) => address.family === 'IPv4' && !address.internal
        ),
        Array.map((address) => ({name, address: address.address}))
      )
    )
  )

  return pipe(
    PREFERRED_INTERFACES,
    Array.findFirst((interfaceName) =>
      Array.findFirst(candidates, (one) => one.name === interfaceName)
    ),
    Option.orElse(() => Array.head(candidates)),
    Option.map(({address}) => address)
  )
}
