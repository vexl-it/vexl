import {
  FetchHttpClient,
  HttpClient,
  type HttpClientError,
} from '@effect/platform/index'
import {Cause, Effect, Exit, Fiber, Option} from 'effect'
import {
  drainAndBlockVexlRequests,
  getActiveVexlRequestCount,
  isVexlEgressBlockedError,
  reopenVexlRequests,
  vexlGatedHttpClientLayer,
  withAllowedVexlOperations,
} from './vexlHttpClientLayer'

let mockControlMode = 'normal'

jest.mock('../utils/deviceMigration/controlStore', () => ({
  readMigrationControlRecord: () => ({mode: mockControlMode}),
}))

const runGetRequest = (
  fetchImpl: typeof fetch
): Effect.Effect<number, HttpClientError.HttpClientError> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient
    const response = yield* client.get('https://vexl.invalid/gate-test')
    return response.status
  }).pipe(
    Effect.scoped,
    Effect.provide(vexlGatedHttpClientLayer),
    Effect.provideService(FetchHttpClient.Fetch, fetchImpl)
  )

const waitFor = async (
  predicate: () => boolean,
  timeoutMs: number = 2000
): Promise<void> => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs)
      throw new Error('waitFor timed out waiting for predicate')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

const expectBlockedExit = (
  exit: Exit.Exit<number, HttpClientError.HttpClientError>
): void => {
  expect(Exit.isFailure(exit)).toBe(true)
  if (!Exit.isFailure(exit)) return
  const failure = Cause.failureOption(exit.cause)
  expect(Option.isSome(failure)).toBe(true)
  if (!Option.isSome(failure)) return
  expect(isVexlEgressBlockedError(failure.value)).toBe(true)
}

describe('vexlGatedHttpClientLayer', () => {
  beforeEach(() => {
    mockControlMode = 'normal'
    reopenVexlRequests()
  })

  it('is synchronously constructible (apiAtom builds it with Effect.runSync)', () => {
    const client = Effect.runSync(
      HttpClient.HttpClient.pipe(Effect.provide(vexlGatedHttpClientLayer))
    )
    expect(client).toBeDefined()
  })

  it('passes requests through in normal mode and returns count to zero', async () => {
    let fetchCalls = 0
    const okFetch: typeof fetch = async () => {
      fetchCalls += 1
      return new Response('ok', {status: 200})
    }

    const status = await Effect.runPromise(runGetRequest(okFetch))

    expect(status).toBe(200)
    expect(fetchCalls).toBe(1)
    expect(getActiveVexlRequestCount()).toBe(0)
  })

  it.each([
    'sourceQuiescing',
    'sourceServing',
    'sourceRetirementCommitted',
    'destinationReceiving',
    'destinationInstalling',
    'recoveryRequired',
  ])(
    'fails fast with VexlEgressBlockedError in %s mode without touching fetch',
    async (mode) => {
      mockControlMode = mode
      let fetchCalls = 0
      const okFetch: typeof fetch = async () => {
        fetchCalls += 1
        return new Response('ok', {status: 200})
      }

      const exit = await Effect.runPromiseExit(runGetRequest(okFetch))

      expectBlockedExit(exit)
      expect(fetchCalls).toBe(0)
      expect(getActiveVexlRequestCount()).toBe(0)
    }
  )

  it('honors the activation allowlist only in destinationActivating mode', async () => {
    mockControlMode = 'destinationActivating'
    let fetchCalls = 0
    const okFetch: typeof fetch = async () => {
      fetchCalls += 1
      return new Response('ok', {status: 200})
    }

    // Without the allowlist region the request is blocked.
    const blockedExit = await Effect.runPromiseExit(runGetRequest(okFetch))
    expectBlockedExit(blockedExit)
    expect(fetchCalls).toBe(0)

    // Inside the allowlist region it passes.
    const status = await Effect.runPromise(
      runGetRequest(okFetch).pipe(
        withAllowedVexlOperations(['notificationTokenUpdate'])
      )
    )
    expect(status).toBe(200)
    expect(fetchCalls).toBe(1)
    expect(getActiveVexlRequestCount()).toBe(0)
  })

  it('ignores the allowlist in every other migration mode', async () => {
    mockControlMode = 'sourceServing'
    let fetchCalls = 0
    const okFetch: typeof fetch = async () => {
      fetchCalls += 1
      return new Response('ok', {status: 200})
    }

    const exit = await Effect.runPromiseExit(
      runGetRequest(okFetch).pipe(
        withAllowedVexlOperations([
          'notificationTokenUpdate',
          'accountReconciliation',
        ])
      )
    )

    expectBlockedExit(exit)
    expect(fetchCalls).toBe(0)
  })

  it('drain cancels interruptible in-flight requests, blocks new ones and reopen restores', async () => {
    const hangingFetch: typeof fetch = async (_input, init) =>
      await new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'))
        })
      })

    const inFlightFiber = Effect.runFork(
      Effect.exit(runGetRequest(hangingFetch))
    )
    await waitFor(() => getActiveVexlRequestCount() === 1)

    await Effect.runPromise(drainAndBlockVexlRequests(5000))
    expect(getActiveVexlRequestCount()).toBe(0)

    // The in-flight request was failed by the closing gate.
    const inFlightExit = await Effect.runPromise(Fiber.join(inFlightFiber))
    expectBlockedExit(inFlightExit)

    // New requests are blocked even though the control mode is 'normal' —
    // the manual block is independent of the mode.
    let fetchCalls = 0
    const okFetch: typeof fetch = async () => {
      fetchCalls += 1
      return new Response('ok', {status: 200})
    }
    const blockedExit = await Effect.runPromiseExit(runGetRequest(okFetch))
    expectBlockedExit(blockedExit)
    expect(fetchCalls).toBe(0)

    // reopen restores normal operation.
    reopenVexlRequests()
    const status = await Effect.runPromise(runGetRequest(okFetch))
    expect(status).toBe(200)
    expect(fetchCalls).toBe(1)
  })

  // Deliberately the last test: the deliberately-uninterruptible request stays
  // active forever and keeps the module-level active count at 1.
  it('drain fails with DrainTimeoutError when a request cannot be interrupted in time', async () => {
    const neverSettlingFetch: typeof fetch = async () =>
      await new Promise<Response>(() => {})

    Effect.runFork(
      Effect.exit(Effect.uninterruptible(runGetRequest(neverSettlingFetch)))
    )
    await waitFor(() => getActiveVexlRequestCount() === 1)

    const exit = await Effect.runPromiseExit(drainAndBlockVexlRequests(300))

    expect(Exit.isFailure(exit)).toBe(true)
    if (!Exit.isFailure(exit)) return
    const failure = Cause.failureOption(exit.cause)
    expect(Option.isSome(failure)).toBe(true)
    if (!Option.isSome(failure)) return
    expect(failure.value._tag).toBe('DrainTimeoutError')
  })
})
