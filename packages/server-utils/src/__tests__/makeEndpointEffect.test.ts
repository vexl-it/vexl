import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, Logger} from 'effect'
import {makeEndpointEffect} from '../makeEndpointEffect'

const captureLogs = async (
  effect: Effect.Effect<unknown, unknown>
): Promise<readonly string[]> => {
  const levels: string[] = []
  const capturingLogger = Logger.make(({logLevel}) => {
    levels.push(logLevel.label)
  })

  await Effect.runPromise(
    Effect.exit(effect).pipe(
      Effect.provide(Logger.replace(Logger.defaultLogger, capturingLogger))
    )
  )

  return levels
}

describe('makeEndpointEffect', () => {
  it('reports a defect once at fatal level', async () => {
    const levels = await captureLogs(
      makeEndpointEffect(Effect.die(new Error('Defect')))
    )

    expect(levels).toEqual(['FATAL'])
  })

  it('reports an unexpected checked error once at error level', async () => {
    const levels = await captureLogs(
      makeEndpointEffect(Effect.fail(new UnexpectedServerError({status: 500})))
    )

    expect(levels).toEqual(['ERROR'])
  })
})
