import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateNoteAdminId,
  generateNoteRepostId,
  newNoteId,
} from '@vexl-next/domain/src/general/notes'
import {
  PrivatePayloadEncrypted,
  SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, HashMap, Schema} from 'effect'
import {type OfferEncryptionProgress} from '../offers/OfferEncryptionProgress'
import {createTestOfferApi} from '../testUtils/offerApi'
import updateNotePrivateParts from './updateNotePrivateParts'
import updateRepostNotePrivateParts from './updateRepostNotePrivateParts'
import {encryptNotePrivatePart} from './utils/encryptNotePrivatePart'

jest.mock('./utils/encryptNotePrivatePart')

afterEach(() => jest.restoreAllMocks())

type NoteUpdate =
  | ReturnType<typeof updateNotePrivateParts>
  | ReturnType<typeof updateRepostNotePrivateParts>

function update(
  repost: boolean,
  onProgress: (progress: OfferEncryptionProgress) => void,
  stopProcessingAfter?: UnixMilliseconds
): Effect.Effect<
  Effect.Effect.Success<NoteUpdate>,
  Effect.Effect.Error<NoteUpdate>
> {
  const params = {
    currentConnections: {firstLevel: [], secondLevel: []},
    targetConnections: {
      firstLevel: Array.makeBy(5, (i) =>
        Schema.decodeSync(PublicKeyV2)(`V2_PUB_${i}`)
      ),
      secondLevel: [],
    },
    ownerPublicKeys: [],
    symmetricKey: Schema.decodeSync(SymmetricKey)('key'),
    api: createTestOfferApi({
      createNotePrivatePart: () => Effect.succeed({}),
      createRepostNotePrivatePart: () => Effect.succeed({}),
    }),
    onProgress,
    stopProcessingAfter,
  }
  return repost
    ? updateRepostNotePrivateParts({
        ...params,
        noteId: newNoteId(),
        repostId: generateNoteRepostId(),
      })
    : updateNotePrivateParts({
        ...params,
        adminId: generateNoteAdminId(),
        commonFriends: HashMap.empty(),
      })
}

it.each([false, true])(
  'lets UI timers run before and during note encryption (repost: %s)',
  async (repost) => {
    let now = 10_000
    let renderedBeforeStart = false
    let renderedDuringBatch = false
    let encrypted = 0
    const timers: Array<ReturnType<typeof setTimeout>> = []
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    jest.mocked(encryptNotePrivatePart).mockImplementation((payload) =>
      Effect.sync(() => {
        expect(renderedBeforeStart).toBe(true)
        if (encrypted >= 2) expect(renderedDuringBatch).toBe(true)
        encrypted += 1
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
      const result = await Effect.runPromise(
        update(repost, (progress) => {
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
        })
      )
      expect(encrypted).toBe(5)
      expect(result.updateSuccess).toBe(true)
      expect(result.newConnections.firstLevel).toHaveLength(5)
    } finally {
      for (const timer of timers) clearTimeout(timer)
    }
  }
)

it.each([false, true])(
  'checks the deadline again after yielding (repost: %s)',
  async (repost) => {
    let now = 10_000
    let timer: ReturnType<typeof setTimeout> | undefined
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    jest.mocked(encryptNotePrivatePart).mockClear()

    try {
      const result = await Effect.runPromise(
        update(
          repost,
          (progress) => {
            if (
              progress.type === 'ENCRYPTING_PRIVATE_PAYLOADS' &&
              progress.currentlyProcessingIndex === 0
            )
              timer = setTimeout(() => {
                now += 100
              }, 0)
          },
          Schema.decodeSync(UnixMilliseconds)(10_050)
        )
      )
      expect(encryptNotePrivatePart).not.toHaveBeenCalled()
      expect(result.updateSuccess).toBe(false)
      expect(result.timeLimitReachedErrors).toHaveLength(5)
    } finally {
      clearTimeout(timer)
    }
  }
)
