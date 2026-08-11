import {Effect} from 'effect'
import {mockedSaveMapStylesToCacheForked} from '../utils/mockedCacheService'
import {
  dummyMapStyles,
  mockedFetchMapStyles,
} from '../utils/mockedMapStylesService'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('map styles', () => {
  beforeEach(() => {
    mockedFetchMapStyles.mockClear()
    mockedSaveMapStylesToCacheForked.mockClear()
  })

  it('serves the fetched style documents and caches them', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(app.Map.getMapStyles({}))

        expect(resp).toEqual(dummyMapStyles)
        expect(mockedFetchMapStyles).toHaveBeenCalledTimes(1)
        expect(mockedSaveMapStylesToCacheForked).toHaveBeenCalledWith(
          dummyMapStyles
        )
      })
    )
  })
})
