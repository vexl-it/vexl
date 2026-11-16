import {ConfigProvider, Effect, Exit} from 'effect'
import {quickConnectPingCooldownStepsMinutesConfig} from '../../configs'

const readSteps = async (
  env: ReadonlyArray<readonly [string, string]>
): Promise<Exit.Exit<readonly number[], unknown>> =>
  await Effect.runPromiseExit(
    quickConnectPingCooldownStepsMinutesConfig.pipe(
      Effect.withConfigProvider(ConfigProvider.fromMap(new Map(env)))
    )
  )

it('defaults the quick connect ping cooldown steps', async () => {
  expect(await readSteps([])).toEqual(Exit.succeed([2, 10, 30, 60]))
})

it('reads the quick connect ping cooldown steps from env', async () => {
  expect(
    await readSteps([['QUICK_CONNECT_PING_COOLDOWN_STEPS_MINUTES', '1,5']])
  ).toEqual(Exit.succeed([1, 5]))
})

it('rejects non positive quick connect ping cooldown steps', async () => {
  expect(
    Exit.isFailure(
      await readSteps([['QUICK_CONNECT_PING_COOLDOWN_STEPS_MINUTES', '0,5']])
    )
  ).toBe(true)
})
