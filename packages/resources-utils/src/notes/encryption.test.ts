import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {newNoteId} from '@vexl-next/domain/src/general/notes'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Array, Effect, HashMap, Schema} from 'effect'
import generateSymmetricKey from '../offers/utils/generateSymmetricKey'
import decryptNote from './decryptNote'
import constructNotePrivatePayloads from './utils/constructNotePrivatePayloads'
import {encryptNotePrivatePart} from './utils/encryptNotePrivatePart'
import encryptNotePublicPayload from './utils/encryptNotePublicPayload'

it.each([
  {keyVersion: 'legacy', direct: true},
  {keyVersion: 'V2', direct: true},
  {keyVersion: 'legacy', direct: false},
  {keyVersion: 'V2', direct: false},
])(
  'decrypts a note with three common friends ($keyVersion, direct: $direct)',
  async ({keyVersion, direct}) => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const recipient = generatePrivateKey()
        const recipientV2 = yield* generateV2KeyPair()
        const publicKey =
          keyVersion === 'V2'
            ? recipientV2.publicKey
            : recipient.publicKeyPemBase64
        const commonFriends = Array.map(
          ['common-friend-1', 'common-friend-2', 'common-friend-3'],
          (value) => Schema.decodeSync(HashedPhoneNumber)(value)
        )
        const symmetricKey = yield* generateSymmetricKey()
        const publicPart = {
          notePublicKey: generatePrivateKey().publicKeyPemBase64,
          text: 'A note for friends. Příliš žluťoučký kůň. 🧡',
          allowRepost: true,
        }
        const publicPayload = yield* encryptNotePublicPayload({
          notePublicPart: publicPart,
          symmetricKey,
        })
        const payloads = yield* constructNotePrivatePayloads({
          symmetricKey,
          connectionsInfo: {
            firstDegreeConnections: direct ? [publicKey] : [],
            // Direct friendship must take precedence when both paths exist.
            secondDegreeConnections: [publicKey],
            commonFriends: HashMap.make([publicKey, commonFriends]),
            verifiedFriends: HashMap.empty(),
            clubsConnections: {},
          },
        })
        expect(payloads).toHaveLength(1)
        const payload = yield* Array.head(payloads)
        const encrypted = yield* encryptNotePrivatePart(payload)
        const note = yield* decryptNote(
          recipient,
          recipientV2
        )({
          id: 1,
          noteId: newNoteId(),
          publicPayload,
          privatePayload: encrypted.payloadPrivate,
          expiresAt: unixMillisecondsFromNow(86_400_000),
          createdAt: isoNow(),
          modifiedAt: isoNow(),
        })
        expect(encrypted.userPublicKey).toBe(publicKey)
        expect(note.publicPart).toEqual(publicPart)
        expect(note.privatePart.commonFriends).toEqual(commonFriends)
        expect(note.privatePart.friendLevel).toEqual([
          direct ? 'FIRST_DEGREE' : 'SECOND_DEGREE',
        ])
        expect(note.privatePart.symmetricKey).toBe(symmetricKey)
        expect(note.privatePart.adminId).toBeUndefined()
      })
    )
  }
)
