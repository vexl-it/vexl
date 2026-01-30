import {detect} from 'detect-port'
import {Effect} from 'effect'
import {MetroPortExhaustedError} from '../errors/startup-errors.js'

const METRO_PORT_START = 8081
const METRO_PORT_END = 8090

/**
 * Find an available port for Metro bundler in the 8081-8090 range.
 *
 * Scans sequentially from 8081 to find the first available port.
 * If all ports are in use, fails with MetroPortExhaustedError.
 *
 * This enables parallel dev:mobile instances, each with its own Metro server.
 *
 * @returns Effect that resolves to available port number
 */
export const findAvailableMetroPort = (): Effect.Effect<
  number,
  MetroPortExhaustedError
> =>
  Effect.gen(function* () {
    for (let port = METRO_PORT_START; port <= METRO_PORT_END; port++) {
      // detect-port returns the same port if available, or next available if not
      const availablePort = yield* Effect.promise(
        async () => await detect(port)
      )
      if (availablePort === port) {
        return port
      }
    }
    return yield* Effect.fail(MetroPortExhaustedError.make())
  })
