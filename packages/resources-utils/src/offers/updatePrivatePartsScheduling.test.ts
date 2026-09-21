import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateAdminId,
  PrivatePayloadEncrypted,
  SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, HashMap, Schema} from 'effect'
import {createTestOfferApi} from '../testUtils/offerApi'
import updatePrivateParts from './updatePrivateParts'
import {encryptPrivatePart} from './utils/encryptPrivatePart'

jest.mock('./utils/encryptPrivatePart')

afterEach(() => jest.restoreAllMocks())

it('lets UI timers run before synchronous encryption and again during a long batch', async () => {
  const recipients = Array.makeBy(5, (i) =>
    Schema.decodeSync(PublicKeyV2)(`V2_PUB_${i}`)
  )
  let now = 10_000
  let renderedBeforeStart = false
  let renderedDuringBatch = false
  let encrypted = 0
  const timers: Array<ReturnType<typeof setTimeout>> = []
  jest.spyOn(Date, 'now').mockImplementation(() => now)
  jest.mocked(encryptPrivatePart).mockImplementation((payload) =>
    Effect.sync(() => {
      expect(renderedBeforeStart).toBe(true)
      if (encrypted >= 2) expect(renderedDuringBatch).toBe(true)
      encrypted += 1
      // Deterministic CPU time without burning wall-clock time in the test.
      now += 5
      return {
        userPublicKey: payload.toPublicKey,
        payloadPrivate: Schema.decodeSync(PrivatePayloadEncrypted)(
          '1ciphertext'
        ),
      }
    })
  )

  try {
    await Effect.runPromise(
      updatePrivateParts({
        currentConnections: {firstLevel: [], secondLevel: [], clubs: {}},
        targetConnections: {firstLevel: recipients, secondLevel: [], clubs: {}},
        adminId: generateAdminId(),
        symmetricKey: Schema.decodeSync(SymmetricKey)('key'),
        commonFriends: HashMap.empty(),
        verifiedFriends: HashMap.empty(),
        api: createTestOfferApi({createPrivatePart: () => Effect.succeed({})}),
        onProgress: (progress) => {
          if (progress.type !== 'ENCRYPTING_PRIVATE_PAYLOADS') return
          if (progress.currentlyProcessingIndex === 0)
            timers.push(
              setTimeout(() => {
                renderedBeforeStart = true
              }, 0)
            )
          if (progress.currentlyProcessingIndex === 2)
            timers.push(
              setTimeout(() => {
                renderedDuringBatch = true
              }, 0)
            )
        },
      })
    )
    expect(encrypted).toBe(recipients.length)
  } finally {
    for (const timer of timers) clearTimeout(timer)
  }
})
