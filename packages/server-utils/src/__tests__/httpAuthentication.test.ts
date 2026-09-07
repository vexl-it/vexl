import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  CurrentSecurity,
  ServerSecurityMiddleware,
} from '@vexl-next/rest-api/src/apiSecurity'
import {
  UserDataShape,
  VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Config, Effect, Layer, Schema} from 'effect'
import {HttpClient, HttpRouter} from 'effect/unstable/http'
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from 'effect/unstable/httpapi'
import {ServerCrypto} from '../ServerCrypto'
import {ServerSecurityMiddlewareLive} from '../serverSecurity'

const api = HttpApi.make('Authentication regression').add(
  HttpApiGroup.make('protected')
    .add(HttpApiEndpoint.get('first', '/first', {success: Schema.String}))
    .add(HttpApiEndpoint.get('last', '/last', {success: Schema.String}))
    .middleware(ServerSecurityMiddleware)
)

it('authenticates every registered endpoint and provides the verified identity to handlers', async () => {
  let handlerCalls = 0
  const handler = Effect.gen(function* () {
    const security = yield* CurrentSecurity
    handlerCalls++
    return security.hash
  })
  const routes = HttpApiBuilder.layer(api).pipe(
    Layer.provide(
      HttpApiBuilder.group(api, 'protected', (h) =>
        h.handle('first', () => handler).handle('last', () => handler)
      )
    ),
    Layer.provide(ServerSecurityMiddlewareLive)
  )
  const keys = generatePrivateKey()
  const v2Keys = await Effect.runPromise(generateV2KeyPair())
  const crypto = ServerCrypto.layer(
    Config.succeed({
      publicKey: keys.publicKeyPemBase64,
      privateKey: keys.privateKeyPemBase64,
      hmacKey: 'authentication-test-hmac',
      easKey: '01234567890123456789012345678901',
      libsodiumPrivateKey: v2Keys.privateKey,
    })
  )
  const server = HttpRouter.serve(routes, {disableLogger: true}).pipe(
    Layer.provideMerge(NodeHttpServer.layerTest),
    Layer.provideMerge(crypto)
  )
  await Effect.runPromise(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const serverCrypto = yield* ServerCrypto
      const hash = Schema.decodeUnknownSync(HashedPhoneNumber)(
        'synthetic-authentication-test'
      )
      const signature = yield* serverCrypto.signEcdsa(
        `${keys.publicKeyPemBase64}${hash}`
      )
      const headers = {'public-key': keys.publicKeyPemBase64, hash, signature}
      for (const path of ['/first', '/last']) {
        const missing = yield* client.get(path)
        expect(missing.status).toBeGreaterThanOrEqual(400)
        expect(yield* missing.json).toMatchObject({_tag: 'UnauthorizedError'})
        const forged = yield* client.get(path, {
          headers: {...headers, hash: 'forged-test-hash'},
        })
        expect(forged.status).toBeGreaterThanOrEqual(400)
        expect(yield* forged.json).toMatchObject({_tag: 'UnauthorizedError'})
        expect(handlerCalls).toBe(path === '/first' ? 0 : 1)
        const valid = yield* client.get(path, {headers})
        expect({
          status: valid.status,
          body: yield* valid.text,
          handlerCalls,
        }).toEqual({
          status: 200,
          body: JSON.stringify(hash),
          handlerCalls: path === '/first' ? 1 : 2,
        })
      }
      const data = {hash, pk: v2Keys.publicKey}
      const encodedData = yield* Schema.encodeEffect(UserDataShape)(data)
      const authorizationSignature =
        yield* serverCrypto.cryptoBoxSign(encodedData)
      const authorization = yield* Schema.encodeEffect(VexlAuthHeader)({
        data,
        signature: authorizationSignature,
      })
      const validV2 = yield* client.get('/last', {
        headers: {...headers, authorization},
      })
      expect(validV2.status).toBe(200)
      expect(yield* validV2.json).toBe(hash)
      const tamperedAuthorization = yield* Schema.encodeEffect(VexlAuthHeader)({
        data: {hash, pk: (yield* generateV2KeyPair()).publicKey},
        signature: authorizationSignature,
      })
      const tamperedV2 = yield* client.get('/last', {
        headers: {...headers, authorization: tamperedAuthorization},
      })
      expect(tamperedV2.status).toBeGreaterThanOrEqual(400)
      expect(yield* tamperedV2.json).toMatchObject({_tag: 'UnauthorizedError'})
      expect(handlerCalls).toBe(3)
    }).pipe(Effect.provide(server))
  )
})
