import {HttpClient, HttpClientResponse} from '@effect/platform'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateLoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Effect, Schema, type Either} from 'effect'
import {api} from '.'
import {AppSource} from '../../commonHeaders'
import {ServiceUrl} from '../../ServiceUrl.brand'
import {UserSessionCredentials} from '../../UserSessionCredentials.brand'

// How a contact-service without a route answers.
const emptyNotFound = HttpClient.make((request) =>
  Effect.succeed(
    HttpClientResponse.fromWeb(request, new Response(null, {status: 404}))
  )
)

const deleteAccountAgainst = async (
  client: HttpClient.HttpClient
): Promise<Either.Either<unknown, unknown>> =>
  await api({
    platform: 'IOS',
    clientVersion: Schema.decodeSync(VersionCode)(1),
    clientSemver: Schema.decodeSync(VersionString)('1.0.0'),
    url: Schema.decodeSync(ServiceUrl)('https://contact.example'),
    isDeveloper: false,
    language: 'en',
    appSource: Schema.decodeSync(AppSource)('test'),
    getUserSessionCredentials: () =>
      Schema.decodeSync(UserSessionCredentials)({
        publicKey: generatePrivateKey().publicKeyPemBase64,
        hash: 'hash',
        signature: 'signature',
      }),
  }).pipe(
    Effect.flatMap((contactApi) =>
      contactApi.deleteAccount({
        loginSessionId: generateLoginSessionId(),
        loginSessionProof: {
          signedAt: unixMillisecondsNow(),
          signature: Schema.decodeSync(EcdsaSignature)('signature'),
        },
      })
    ),
    Effect.provideService(HttpClient.HttpClient, client),
    Effect.either,
    Effect.runPromise
  )

describe('deleteAccount', () => {
  it('tells a contact-service without the route by its empty 404', async () => {
    expect(await deleteAccountAgainst(emptyNotFound)).toMatchObject({
      _tag: 'Left',
      left: {_tag: 'DeleteAccountRouteMissingError'},
    })
  })
})
