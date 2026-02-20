import {cryptobox, PublicKeyV2} from '@vexl-next/cryptography'
import {
  UnixMilliseconds,
  unixMillisecondsFromNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  CryptoBoxCypher,
  cryptoBoxSign,
  CryptoBoxSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {UpgradeAuthChallenge} from '@vexl-next/rest-api/src/services/user/contracts'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Schema} from 'effect'
import {cryptoConfig} from '../../configs'
import {generateChallengeForPublicKey, verifyChallengeResponse} from './utils'

const decodeCypher = Schema.decodeSync(CryptoBoxCypher)
const decodeSignature = Schema.decodeSync(CryptoBoxSignature)

const ChallengePayload = Schema.parseJson(
  Schema.Struct({
    forPublicKey: PublicKeyV2,
    validUntil: UnixMilliseconds,
  })
)

const generateKeyPair = (): Effect.Effect<
  Awaited<ReturnType<typeof cryptobox.generateKeyPair>>
> => Effect.promise(async () => await cryptobox.generateKeyPair())

const runWithServerCrypto = async <A, E>(
  effect: Effect.Effect<A, E, ServerCrypto>
): Promise<A> =>
  await Effect.runPromise(
    effect.pipe(Effect.provide(ServerCrypto.layer(cryptoConfig)))
  )

describe('upgradeAuth utils', () => {
  it('generates challenge for public key', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = yield* _(generateKeyPair())
        const challenge = yield* _(
          generateChallengeForPublicKey(keyPair.publicKey)
        )

        expect(challenge.startsWith('CBCiph-')).toBe(true)
      })
    )
  })

  it('rejects malformed challenge payload', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = yield* _(generateKeyPair())
        const challenge = decodeCypher('CBCiph-not-a-valid-encrypted-payload')
        const signature = decodeSignature('CBSig-random-signature')

        const result = yield* _(
          verifyChallengeResponse(keyPair.publicKey, challenge, signature),
          Effect.either
        )

        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toBe('UpgradeAuthInvalidSignatureError')
          expect(result.left.message).toBe('Invalid challenge')
        }
      })
    )
  })

  it('rejects challenge created for different public key', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const firstKeyPair = yield* _(generateKeyPair())
        const secondKeyPair = yield* _(generateKeyPair())

        const challenge = yield* _(
          generateChallengeForPublicKey(firstKeyPair.publicKey)
        )
        const signature = yield* _(
          cryptoBoxSign(secondKeyPair.privateKey)(challenge)
        )

        const result = yield* _(
          verifyChallengeResponse(
            secondKeyPair.publicKey,
            challenge,
            signature
          ),
          Effect.either
        )

        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toBe('UpgradeAuthInvalidSignatureError')
          expect(result.left.message).toBe('Invalid challenge')
        }
      })
    )
  })

  it('rejects expired challenge', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = yield* _(generateKeyPair())
        const crypto = yield* _(ServerCrypto)

        const expiredChallenge = yield* _(
          crypto.cryptoBoxSeal(ChallengePayload)({
            forPublicKey: keyPair.publicKey,
            validUntil: unixMillisecondsFromNow(-1000),
          }),
          Effect.flatMap(Schema.decode(UpgradeAuthChallenge))
        )

        const signature = yield* _(
          cryptoBoxSign(keyPair.privateKey)(expiredChallenge)
        )

        const result = yield* _(
          verifyChallengeResponse(
            keyPair.publicKey,
            expiredChallenge,
            signature
          ),
          Effect.either
        )

        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toBe('UpgradeAuthInvalidSignatureError')
          expect(result.left.message).toBe('Invalid challenge')
        }
      })
    )
  })

  it('rejects invalid signature for a valid challenge', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = yield* _(generateKeyPair())
        const differentKeyPair = yield* _(generateKeyPair())

        const challenge = yield* _(
          generateChallengeForPublicKey(keyPair.publicKey)
        )
        const wrongSignature = yield* _(
          cryptoBoxSign(differentKeyPair.privateKey)(challenge)
        )

        const result = yield* _(
          verifyChallengeResponse(keyPair.publicKey, challenge, wrongSignature),
          Effect.either
        )

        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toBe('UpgradeAuthInvalidSignatureError')
          expect(result.left.message).toBe('Invalid signature')
        }
      })
    )
  })

  it('verifies valid challenge response', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = yield* _(generateKeyPair())
        const challenge = yield* _(
          generateChallengeForPublicKey(keyPair.publicKey)
        )
        const signature = yield* _(cryptoBoxSign(keyPair.privateKey)(challenge))

        const result = yield* _(
          verifyChallengeResponse(keyPair.publicKey, challenge, signature),
          Effect.either
        )

        expect(result._tag).toBe('Right')
      })
    )
  })
})
