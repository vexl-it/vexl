import {FetchHttpClient} from '@effect/platform/index'
import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {generateLoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {type MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {cryptoBoxSign} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {deriveIdentityKeyPairV2} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {user} from '@vexl-next/rest-api/src'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {type VexlAuthHeader} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Effect, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {apiEnv, platform} from '../../api'
import {
  type SessionPhoneNumber,
  type SessionV1,
  type SessionV2,
} from '../../brands/Session.brand'
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
  credentials: UserSessionCredentials,
  keysV2: KeyPairV2
): Effect.Effect<VexlAuthHeader, UpgradeSessionError> {
  return Effect.gen(function* (_) {
    const store = getDefaultStore()

    const userApi = yield* _(
      user.api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.userMs,
        getUserSessionCredentials: () => credentials,
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

    const initResponse = yield* _(
      userApi.initUpgradeAuth({publicKeyV2: keysV2.publicKey}),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to initialize auth upgrade challenge',
            cause: e,
          })
      )
    )

    const signature = yield* _(
      cryptoBoxSign(keysV2.privateKey)(initResponse.challenge),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to sign auth upgrade challenge',
            cause: e,
          })
      )
    )

    const submitResponse = yield* _(
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

/**
 * Adds the VexlAuth header for `keysV2` to V1 credentials of a phone number.
 */
export const upgradeSessionCredentials = (
  credentials: UserSessionCredentials,
  keysV2: KeyPairV2
): Effect.Effect<
  SessionPhoneNumber['sessionCredentials'],
  UpgradeSessionError
> =>
  fetchVexlAuthHeaderFromServer(credentials, keysV2).pipe(
    Effect.map((vexlAuthHeader) => ({...credentials, vexlAuthHeader}))
  )

export const upgradeSession = (
  session: SessionV1,
  masterSeed: MasterSeed
): Effect.Effect<SessionV2, UpgradeSessionError> =>
  Effect.gen(function* (_) {
    const v2Keys = yield* _(
      deriveIdentityKeyPairV2(masterSeed),
      Effect.mapError(
        (e) =>
          new UpgradeSessionError({
            message: 'Failed to derive V2 keys during session upgrade',
            cause: e,
          })
      )
    )

    const sessionCredentials = yield* _(
      upgradeSessionCredentials(session.sessionCredentials, v2Keys)
    )

    return {
      ...session,
      keyPairV2: v2Keys,
      sessionCredentials,
      isLiquidityProvider: false,
      masterSeed,
      loginSessionId: generateLoginSessionId(),
    }
  })
