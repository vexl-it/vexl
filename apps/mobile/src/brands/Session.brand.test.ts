import {KeyHolder} from '@vexl-next/cryptography'
import {Schema} from 'effect'
import {
  isSessionV2,
  sanityCheckSessionV2,
  Session,
  type SessionV2,
} from './Session.brand'

const privateKey = KeyHolder.generatePrivateKey()
const publicKeyV2 = 'V2_PUB_p6FxgibooVetxEQ0EcrVLVJCvJq0cmeNnENs00Y9Z3U'

const encodedCredentials = (
  hash: string,
  {
    authHash = hash,
    publicKey = privateKey.publicKeyPemBase64,
  }: {authHash?: string; publicKey?: string} = {}
): Record<string, string> => ({
  publicKey,
  hash,
  signature: `signature-${hash}`,
  vexlAuthHeader: `VexlAuth ${Buffer.from(
    JSON.stringify({pk: publicKeyV2, hash: authHash})
  ).toString('base64')}.CBSig-signature`,
})

const encodedSession = {
  version: 1,
  phoneNumber: '+420733733733',
  sessionCredentials: encodedCredentials('main-hash'),
  privateKey,
  keyPairV2: {
    publicKey: publicKeyV2,
    privateKey:
      'V2_PRIV_dIFCw3_09AW5Xaz7EADTRKE5SbJrBjCozIX12oGb-8inoXGCJuihV63ERDQRytUtUkK8mrRyZ42cQ2zTRj1ndQ',
  },
  masterSeed: '00'.repeat(32),
  loginSessionId: '00000000-0000-4000-8000-000000000000',
}

const decodeSessionV2 = (encoded: unknown): SessionV2 => {
  const session = Schema.decodeUnknownSync(Session)(encoded)
  if (!isSessionV2(session)) throw new Error('Expected SessionV2')
  return session
}

const withExtraNumber = (
  credentials: Record<string, string>
): Record<string, unknown> => ({
  ...encodedSession,
  extraPhoneNumbers: [
    {phoneNumber: '+420777777777', sessionCredentials: credentials},
  ],
})

it('decodes a session stored before extra phone numbers existed', () => {
  const session = decodeSessionV2(encodedSession)

  expect(session.extraPhoneNumbers).toBeUndefined()
  expect(sanityCheckSessionV2(session)).toBe(true)
})

it('keeps extra phone numbers through storage encoding', () => {
  const session = decodeSessionV2(
    withExtraNumber(encodedCredentials('extra-hash'))
  )

  const reloaded = decodeSessionV2(
    Schema.decodeUnknownSync(Schema.parseJson())(
      Schema.encodeSync(Schema.parseJson(Session))(session)
    )
  )

  expect(reloaded.extraPhoneNumbers).toEqual([
    {
      phoneNumber: '+420777777777',
      sessionCredentials: session.extraPhoneNumbers?.[0]?.sessionCredentials,
    },
  ])
  expect(sanityCheckSessionV2(reloaded)).toBe(true)
})

it('fails the sanity check when extra credentials do not belong to the session', () => {
  expect(
    sanityCheckSessionV2(
      decodeSessionV2(
        withExtraNumber(
          encodedCredentials('extra-hash', {authHash: 'other-hash'})
        )
      )
    )
  ).toBe(false)

  expect(
    sanityCheckSessionV2(
      decodeSessionV2(
        withExtraNumber(
          encodedCredentials('extra-hash', {
            publicKey: KeyHolder.generatePrivateKey().publicKeyPemBase64,
          })
        )
      )
    )
  ).toBe(false)
})
