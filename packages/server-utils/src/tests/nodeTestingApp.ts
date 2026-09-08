import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type CryptoError,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Context, Effect, flow, Layer, Ref} from 'effect'
import {type ReadonlyRecord} from 'effect/Record'
import {HttpClient, HttpClientRequest} from 'effect/unstable/http'
import {
  HttpApiClient,
  type HttpApi,
  type HttpApiGroup,
} from 'effect/unstable/httpapi'
import {type Client} from 'effect/unstable/httpapi/HttpApiClient'
import {type ServerCrypto} from '../ServerCrypto'
import {
  createDummyAuthHeaders,
  createDummyAuthHeadersForUser,
} from './createDummyAuthHeaders'

export class TestRequestHeaders extends Context.Service<
  TestRequestHeaders,
  Ref.Ref<ReadonlyRecord<string, string>>
>()('TestRequestHeaders') {
  static Live = Layer.effect(
    TestRequestHeaders,
    Ref.make({}) // Initialize with an empty record
  )

  static getHeaders = TestRequestHeaders.pipe(
    Effect.flatMap((ref) => Ref.get(ref))
  )

  static setHeaders = (
    headers: ReadonlyRecord<string, string>
  ): Effect.Effect<void, never, TestRequestHeaders> =>
    TestRequestHeaders.pipe(Effect.flatMap((ref) => Ref.set(headers)(ref)))
}

export const createNodeTestingApp = <
  ApiId extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<ApiId, Groups>
): Effect.Effect<
  Client<Groups>,
  never,
  | HttpApiGroup.MiddlewareClient<Groups>
  | HttpClient.HttpClient
  | TestRequestHeaders
> =>
  Effect.gen(function* () {
    const testRequestHeadersRef = yield* TestRequestHeaders

    return yield* HttpApiClient.make(api, {
      transformClient: flow(
        HttpClient.mapRequestEffect((r) =>
          Effect.gen(function* () {
            const testHeaders = yield* Ref.get(testRequestHeadersRef)
            return HttpClientRequest.setHeaders({
              ...r.headers,
              ...testHeaders,
            })(r)
          })
        )
      ),
    })
  })

export const setAuthHeaders = (headers: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}): Effect.Effect<void, never, TestRequestHeaders> =>
  TestRequestHeaders.pipe(
    Effect.flatMap(
      Ref.update((c) => ({
        ...c,
        ...headers,
      }))
    )
  )

export const clearTestAuthHeaders: Effect.Effect<
  void,
  never,
  TestRequestHeaders
> = TestRequestHeaders.pipe(
  Effect.flatMap(
    Ref.set({}) // Clear all headers by setting to an empty record
  )
)

export const setDummyAuthHeadersForUser = (args: {
  phoneNumber: E164PhoneNumber
  publicKey: PublicKeyPemBase64
}): Effect.Effect<void, CryptoError, TestRequestHeaders | ServerCrypto> =>
  createDummyAuthHeadersForUser(args).pipe(
    Effect.flatMap((headers) => setAuthHeaders(headers))
  )

export const setDummyAuthHeaders: Effect.Effect<
  void,
  CryptoError,
  TestRequestHeaders | ServerCrypto
> = createDummyAuthHeaders.pipe(
  Effect.flatMap((headers) => setAuthHeaders(headers))
)

export const addTestHeaders = (
  toAdd: Record<string, string>
): Effect.Effect<void, never, TestRequestHeaders> =>
  TestRequestHeaders.pipe(
    Effect.flatMap(
      Ref.update((c) => ({
        ...c,
        ...toAdd,
      }))
    )
  )
