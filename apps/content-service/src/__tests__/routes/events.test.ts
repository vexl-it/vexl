import {Effect, pipe, Result} from 'effect'
import {mockedSaveEventsToCacheForked} from '../utils/mockedCacheService'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('events', () => {
  beforeEach(() => {
    mockedSaveEventsToCacheForked.mockClear()
  })

  it('does not refresh redis cache when events are already cached', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const resp = yield* pipe(app.Cms.getEvents({}), Effect.result)

        expect(Result.isSuccess(resp)).toBe(true)
        expect(mockedSaveEventsToCacheForked).not.toHaveBeenCalled()
      })
    )
  })
})
