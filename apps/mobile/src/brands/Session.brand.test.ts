import {KeyHolder} from '@vexl-next/cryptography'
import {Schema} from 'effect'
import {makeExtraPhoneNumber} from '../state/session/extraPhoneNumber.testUtils'
import {
  type ExtraSessionPhoneNumber,
  isSessionV2,
  sanityCheckSessionV2,
  sensitiveValuesOfSession,
  Session,
  type SessionV2,
} from './Session.brand'

const privateKey = KeyHolder.generatePrivateKey()
const publicKeyV2 = 'V2_PUB_p6FxgibooVetxEQ0EcrVLVJCvJq0cmeNnENs00Y9Z3U'

const encodedSession = {
  version: 1,
  phoneNumber: '+420733733733',
  sessionCredentials: {
    publicKey: privateKey.publicKeyPemBase64,
    hash: 'main-hash',
    signature: 'signature-main-hash',
    vexlAuthHeader: `VexlAuth ${Buffer.from(
      JSON.stringify({pk: publicKeyV2, hash: 'main-hash'})
    ).toString('base64')}.CBSig-signature`,
  },
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

const extra = makeExtraPhoneNumber({
  phoneNumber: '+420777777777',
  hash: 'extra-hash',
  index: 0,
})

const withExtraNumber = (one: ExtraSessionPhoneNumber): SessionV2 => ({
  ...decodeSessionV2(encodedSession),
  extraPhoneNumbers: [one],
})

it('decodes a session stored before extra phone numbers existed', () => {
  const session = decodeSessionV2(encodedSession)

  expect(session.extraPhoneNumbers).toBeUndefined()
  expect(sanityCheckSessionV2(session)).toBe(true)
})

it('keeps extra phone numbers with their own keys through storage encoding', () => {
  const session = withExtraNumber(extra)

  const reloaded = decodeSessionV2(
    Schema.decodeUnknownSync(Schema.parseJson())(
      Schema.encodeSync(Schema.parseJson(Session))(session)
    )
  )

  expect(reloaded.extraPhoneNumbers).toEqual([extra])
  expect(sanityCheckSessionV2(reloaded)).toBe(true)
})

it('fails the sanity check when extra credentials do not belong to the extra keys', () => {
  const otherHash = makeExtraPhoneNumber({
    phoneNumber: '+420777777777',
    hash: 'other-hash',
    index: 0,
  })
  expect(
    sanityCheckSessionV2(
      withExtraNumber({
        ...extra,
        sessionCredentials: {
          ...extra.sessionCredentials,
          vexlAuthHeader: otherHash.sessionCredentials.vexlAuthHeader,
        },
      })
    )
  ).toBe(false)

  // Credentials of the main key, as variant "one key for all numbers" had them
  const session = decodeSessionV2(encodedSession)
  expect(
    sanityCheckSessionV2(
      withExtraNumber({
        ...extra,
        sessionCredentials: {
          ...extra.sessionCredentials,
          publicKey: session.privateKey.publicKeyPemBase64,
        },
      })
    )
  ).toBe(false)
})

it('fails the sanity check when two numbers share a key', () => {
  const session = decodeSessionV2(encodedSession)
  expect(
    sanityCheckSessionV2(
      withExtraNumber({
        ...extra,
        privateKey: session.privateKey,
        keyPairV2: session.keyPairV2,
        sessionCredentials: {
          ...session.sessionCredentials,
          hash: extra.sessionCredentials.hash,
          vexlAuthHeader: {
            ...session.sessionCredentials.vexlAuthHeader,
            data: {
              ...session.sessionCredentials.vexlAuthHeader.data,
              hash: extra.sessionCredentials.hash,
            },
          },
        },
      })
    )
  ).toBe(false)
})

it('treats the keys and credentials of every number as sensitive', () => {
  const sensitive = sensitiveValuesOfSession(withExtraNumber(extra))

  expect(sensitive).toEqual(
    expect.arrayContaining([
      privateKey.privateKeyPemBase64,
      encodedSession.keyPairV2.privateKey,
      encodedSession.masterSeed,
      extra.phoneNumber,
      extra.privateKey.privateKeyPemBase64,
      extra.keyPairV2.privateKey,
      extra.sessionCredentials.hash,
      extra.sessionCredentials.signature,
    ])
  )
})
