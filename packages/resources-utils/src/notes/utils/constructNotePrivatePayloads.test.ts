import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {NotePrivatePart} from '@vexl-next/domain/src/general/notes'
import {SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, HashMap, Schema} from 'effect'
import constructNotePrivatePayloads from './constructNotePrivatePayloads'

const symmetricKey = Schema.decodeSync(SymmetricKey)('symmetric-key')

it('fills trusted friends per recipient and leaves them empty for recipients without any', async () => {
  const withTrusted = generatePrivateKey().publicKeyPemBase64
  const withoutTrusted = generatePrivateKey().publicKeyPemBase64
  const trustedFriend = Schema.decodeSync(HashedPhoneNumber)('trusted-friend')

  const payloads = await Effect.runPromise(
    constructNotePrivatePayloads({
      symmetricKey,
      connectionsInfo: {
        firstDegreeConnections: [withTrusted, withoutTrusted],
        secondDegreeConnections: [],
        commonFriends: HashMap.make([withTrusted, [trustedFriend]]),
        verifiedFriends: HashMap.make([withTrusted, [trustedFriend]]),
        clubsConnections: {},
      },
    })
  )

  expect(
    Object.fromEntries(
      Array.map(payloads, (one) => [
        one.toPublicKey,
        one.payloadPrivate.verifiedCommonFriends,
      ])
    )
  ).toEqual({[withTrusted]: [trustedFriend], [withoutTrusted]: []})
})

it('decodes a note payload from an older client without trusted friends', () => {
  expect(
    Schema.decodeUnknownSync(NotePrivatePart)({
      commonFriends: [],
      friendLevel: ['FIRST_DEGREE'],
      symmetricKey: 'symmetric-key',
    }).verifiedCommonFriends
  ).toEqual([])
})
