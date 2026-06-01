import {Effect, Either} from 'effect'
import {mockedSaveEventsToCacheForked} from '../utils/mockedCacheService'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('events', () => {
  beforeEach(() => {
    mockedSaveEventsToCacheForked.mockClear()
  })

  it('does not refresh redis cache when events are already cached', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(app.Cms.getEvents({}), Effect.either)

        expect(Either.isRight(resp)).toBe(true)
        expect(mockedSaveEventsToCacheForked).not.toHaveBeenCalled()
      })
    )
  })
})
