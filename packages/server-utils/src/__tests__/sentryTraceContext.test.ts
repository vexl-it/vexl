import {Cause, Effect, Exit, Logger, Option, type Context} from 'effect'
import {
  grafanaTraceUrl,
  prettifyError,
  traceContextFromContext,
} from '../sentry'

const runWithCapturingLogger = async (
  effect: Effect.Effect<void>
): Promise<Context.Context<never>> => {
  let captured: Context.Context<never> | undefined
  const capturingLogger = Logger.make(({fiber}) => {
    captured = fiber.context
  })
  await Effect.runPromise(
    effect.pipe(
      Effect.provide(Logger.layer([capturingLogger], {mergeWithExisting: true}))
    )
  )
  if (captured === undefined) throw new Error('Logger was not called')
  return captured
}

describe('traceContextFromContext', () => {
  it('finds the active span of the logging fiber', async () => {
    const fiberRefs = await runWithCapturingLogger(
      Effect.logError('boom').pipe(Effect.withSpan('test-span'))
    )

    const trace = traceContextFromContext(fiberRefs)
    expect(Option.isSome(trace)).toBe(true)
    if (Option.isSome(trace)) {
      expect(trace.value.traceId).toEqual(expect.any(String))
      expect(trace.value.traceId.length).toBeGreaterThan(0)
      expect(trace.value.spanId.length).toBeGreaterThan(0)
    }
  })

  it('returns none when no span is active', async () => {
    const fiberRefs = await runWithCapturingLogger(Effect.logError('boom'))
    expect(Option.isNone(traceContextFromContext(fiberRefs))).toBe(true)
  })
})

describe('prettifyError', () => {
  class TestError extends Error {
    constructor(message: string, cause?: Error) {
      super(message, {cause})
      this.name = 'TestError'
    }
  }

  it('appends span frames and strips effect-internal frames', async () => {
    const exit = await Effect.runPromiseExit(
      Effect.fail(new TestError('boom')).pipe(
        Effect.withSpan('inner-span'),
        Effect.withSpan('outer-span')
      )
    )
    expect(Exit.isFailure(exit)).toBe(true)
    if (!Exit.isFailure(exit)) return
    const error = Cause.squash(exit.cause)
    expect(error).toBeInstanceOf(Error)
    if (!(error instanceof Error)) return
    const pretty = prettifyError(error, exit.cause)
    expect(pretty.name).toBe('TestError')
    expect(pretty.message).toBe('boom')
    expect(pretty.stack).toContain('at inner-span')
    expect(pretty.stack).toContain('at outer-span')
    expect(pretty.stack).not.toContain('internal/core')
  })

  it('prettifies the cause chain', async () => {
    const error = await Effect.runPromise(
      Effect.flip(
        Effect.fail(new TestError('outer', new TestError('inner'))).pipe(
          Effect.withSpan('some-span')
        )
      )
    )

    const pretty = prettifyError(error)
    expect(pretty.cause).toBeInstanceOf(Error)
    if (pretty.cause instanceof Error) {
      expect(pretty.cause.message).toBe('inner')
    }
  })

  it('returns errors without a span unchanged apart from the stack cleanup', () => {
    const pretty = prettifyError(new TestError('plain'))
    expect(pretty.name).toBe('TestError')
    expect(pretty.message).toBe('plain')
  })
})

describe('grafanaTraceUrl', () => {
  it('builds an explore link with the trace id, trimming trailing slashes', () => {
    const url = grafanaTraceUrl('https://grafana.vexl.it/', 'abc123')
    expect(url).toEqual(
      `https://grafana.vexl.it/explore?left=${encodeURIComponent(
        JSON.stringify({queries: [{query: 'abc123', queryType: 'traceql'}]})
      )}`
    )
  })

  it('preselects the Tempo datasource when its uid is provided', () => {
    const url = grafanaTraceUrl('https://grafana.vexl.it', 'abc123', 'tempo-1')
    expect(url).toMatch(
      /^https:\/\/grafana\.vexl\.it\/explore\?schemaVersion=1&panes=.*&orgId=1$/
    )
    const panes = JSON.parse(new URL(url).searchParams.get('panes') ?? '')
    expect(panes.sentry.datasource).toBe('tempo-1')
    expect(panes.sentry.queries[0]).toMatchObject({
      query: 'abc123',
      queryType: 'traceql',
      datasource: {type: 'tempo', uid: 'tempo-1'},
    })
  })
})
