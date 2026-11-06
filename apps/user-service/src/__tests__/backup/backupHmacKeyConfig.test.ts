import {ConfigProvider, Effect, Exit} from 'effect'
import {backupHmacKeyConfig} from '../../configs'

const readKey = async (key: string): Promise<Exit.Exit<unknown, unknown>> =>
  await Effect.runPromiseExit(
    backupHmacKeyConfig.pipe(
      Effect.withConfigProvider(
        ConfigProvider.fromMap(new Map([['SECRET_BACKUP_HMAC_KEY', key]]))
      )
    )
  )

it('rejects a backup HMAC key shorter than 32 bytes', async () => {
  expect(Exit.isFailure(await readKey('x'.repeat(31)))).toBe(true)
  expect(Exit.isSuccess(await readKey('x'.repeat(32)))).toBe(true)
})
