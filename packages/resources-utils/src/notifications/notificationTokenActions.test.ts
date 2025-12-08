import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {PLATFORM_ANDROID} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Exit, Schema} from 'effect/index'
import {
  decryptNotificationToken,
  ecnryptNotificationToken,
} from './notificationTokenActions'

it('Encrypts and decrypts notification token properly', async () => {
  const result = await Effect.gen(function* (_) {
    const serverKey = generatePrivateKey()

    const payload = {
      locale: 'cs',
      notificationToken: 'someToken' as ExpoNotificationToken,
      clientVersion: Schema.decodeSync(VersionCode)(1),
      clientPlatform: PLATFORM_ANDROID,
      serverPublicKey: serverKey.publicKeyPemBase64,
    }

    const encrypted = yield* _(ecnryptNotificationToken(payload))
    const decrypted = yield* _(
      decryptNotificationToken({
        notificationCypher: encrypted,
        privateKey: serverKey.privateKeyPemBase64,
      })
    )

    expect(payload.locale).toBe(decrypted.data.locale)
    expect(payload.clientPlatform).toBe(decrypted.data.clientPlatform)
    expect(payload.clientVersion).toBe(decrypted.data.clientVersion)
    expect(payload.notificationToken).toBe(decrypted.expoToken)
    expect(decrypted.type).toBe('expoV2')
  }).pipe(Effect.exit, Effect.runPromise)

  expect(Exit.isSuccess(result)).toBe(true)
})

it('Does not decrypts notification token when badly encrypted', async () => {
  const result = await Effect.gen(function* (_) {
    const serverKey = generatePrivateKey()
    const badKey = generatePrivateKey()

    const payload = {
      locale: 'cs',
      notificationToken: 'someToken' as ExpoNotificationToken,
      clientVersion: Schema.decodeSync(VersionCode)(1),
      clientPlatform: PLATFORM_ANDROID,
      serverPublicKey: badKey.publicKeyPemBase64,
    }

    const encrypted = yield* _(ecnryptNotificationToken(payload))
    const decrypted = yield* _(
      decryptNotificationToken({
        notificationCypher: encrypted,
        privateKey: serverKey.privateKeyPemBase64,
      })
    )

    expect(payload.locale).toBe(decrypted.data.locale)
    expect(payload.clientPlatform).toBe(decrypted.data.clientPlatform)
    expect(payload.clientVersion).toBe(decrypted.data.clientVersion)
    expect(payload.notificationToken).toBe(decrypted.expoToken)
    expect(decrypted.type).toBe('expoV2')
  }).pipe(Effect.exit, Effect.runPromise)

  expect(Exit.isFailure(result)).toBe(true)
})
