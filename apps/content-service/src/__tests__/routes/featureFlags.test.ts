import {Effect} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('feature flags', () => {
  it('keeps flags off when not configured', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(app.FeatureFlags.getFeatureFlags({}))

        expect(resp).toEqual({trustedFriends: false})
      })
    )
  })
})
