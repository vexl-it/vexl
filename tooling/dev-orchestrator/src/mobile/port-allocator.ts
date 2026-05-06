import {Effect} from 'effect'
import {createServer} from 'node:net'
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
const canBindPort = (port: number): Effect.Effect<boolean> =>
  Effect.async((resume) => {
    const server = createServer()

    server.once('error', () => {
      resume(Effect.succeed(false))
    })

    server.listen(port, () => {
      server.close(() => {
        resume(Effect.succeed(true))
      })
    })
  })

export const findAvailableMetroPort = (): Effect.Effect<
  number,
  MetroPortExhaustedError
> =>
  Effect.gen(function* () {
    for (let port = METRO_PORT_START; port <= METRO_PORT_END; port++) {
      const available = yield* canBindPort(port)
      if (available) {
        return port
      }
    }
    return yield* Effect.fail(MetroPortExhaustedError.make())
  })
