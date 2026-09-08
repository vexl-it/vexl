import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  cryptoBoxSign,
  generateV2KeyPair,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {user} from '@vexl-next/rest-api/src'
import {type VexlAuthHeader} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Effect, pipe, Schema} from 'effect'
import {FetchHttpClient} from 'effect/unstable/http'
import {getDefaultStore} from 'jotai'
import {apiEnv, platform} from '../../api'
import {type SessionV1, type SessionV2} from '../../brands/Session.brand'
import {
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../../utils/environment'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../../utils/preferences'

export class UpgradeSessionError extends Schema.TaggedError<UpgradeSessionError>(
  'UpgradeSessionError'
)('UpgradeSessionError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

function fetchVexlAuthHeaderFromServer(
  session: SessionV1,
  keysV2: KeyPairV2
): Effect.Effect<VexlAuthHeader, UpgradeSessionError> {
  return Effect.gen(function* () {
    const store = getDefaultStore()

    const userApi = yield* pipe(
      user.api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.userMs,
        getUserSessionCredentials: () => session.sessionCredentials,
        appSource,
        language: store.get(translationAtom).t('localeName'),
        isDeveloper: store.get(isDeveloperAtom),
        deviceModel,
        osVersion,
      }),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to create user API for auth upgrade',
            cause: e,
          })
      )
    )

    const initResponse = yield* pipe(
      userApi.initUpgradeAuth({publicKeyV2: keysV2.publicKey}),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to initialize auth upgrade challenge',
            cause: e,
          })
      )
    )

    const signature = yield* pipe(
      cryptoBoxSign(keysV2.privateKey)(initResponse.challenge),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to sign auth upgrade challenge',
            cause: e,
          })
      )
    )

    const submitResponse = yield* pipe(
      userApi.submitUpgradeAuth({
        publicKeyV2: keysV2.publicKey,
        challenge: initResponse.challenge,
        signature,
      }),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to submit auth upgrade challenge',
            cause: e,
          })
      )
    )

    return submitResponse.vexlAuthHeader
  }).pipe(Effect.provide(FetchHttpClient.layer))
}

export const upgradeSession = (
  session: SessionV1
): Effect.Effect<SessionV2, UpgradeSessionError> =>
  Effect.gen(function* () {
    const v2Keys = yield* pipe(
      generateV2KeyPair(),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to generate V2 keys during session upgrade',
            cause: e,
          })
      )
    )

    const vexlAuthHeader = yield* fetchVexlAuthHeaderFromServer(session, v2Keys)

    return {
      ...session,
      keyPairV2: v2Keys,
      sessionCredentials: {
        ...session.sessionCredentials,
        vexlAuthHeader,
      },
      isLiquidityProvider: false,
    }
  })
