import {Effect, Logger, Option, type FiberRefs} from 'effect'
import {grafanaTraceUrl, traceContextFromFiberRefs} from '../sentry'

const runWithCapturingLogger = async (
  effect: Effect.Effect<void>
): Promise<FiberRefs.FiberRefs> => {
  let captured: FiberRefs.FiberRefs | undefined
  const capturingLogger = Logger.make(({context}) => {
    captured = context
  })
  await Effect.runPromise(
    effect.pipe(Effect.provide(Logger.add(capturingLogger)))
  )
  if (captured === undefined) throw new Error('Logger was not called')
  return captured
}

describe('traceContextFromFiberRefs', () => {
  it('finds the active span of the logging fiber', async () => {
    const fiberRefs = await runWithCapturingLogger(
      Effect.logError('boom').pipe(Effect.withSpan('test-span'))
    )

    const trace = traceContextFromFiberRefs(fiberRefs)
    expect(Option.isSome(trace)).toBe(true)
    if (Option.isSome(trace)) {
      expect(trace.value.traceId).toEqual(expect.any(String))
      expect(trace.value.traceId.length).toBeGreaterThan(0)
      expect(trace.value.spanId.length).toBeGreaterThan(0)
    }
  })

  it('returns none when no span is active', async () => {
    const fiberRefs = await runWithCapturingLogger(Effect.logError('boom'))
    expect(Option.isNone(traceContextFromFiberRefs(fiberRefs))).toBe(true)
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
