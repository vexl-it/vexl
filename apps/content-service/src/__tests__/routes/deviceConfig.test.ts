import {Effect} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('device config', () => {
  it('keeps trusted friends off when not configured', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(app.DeviceConfig.getDeviceConfig({}))

        expect(resp).toEqual({trustedFriends: false})
      })
    )
  })
})
