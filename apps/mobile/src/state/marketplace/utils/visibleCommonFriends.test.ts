import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {NoteInfo, newNoteId} from '@vexl-next/domain/src/general/notes'
import {Schema} from 'effect'
import {
  deriveVisibleCommonFriendsForChat,
  deriveVisibleCommonFriendsForNote,
} from './visibleCommonFriends'

const hash = Schema.decodeSync(HashedPhoneNumber)
const imported = hash('imported')
const importedTrusted = hash('imported-trusted')
const notImportedTrusted = hash('not-imported-trusted')
const importedContactsHashes = [imported, importedTrusted]

function noteWith(
  commonFriends: readonly string[],
  verifiedCommonFriends: readonly string[]
): NoteInfo {
  return Schema.decodeSync(NoteInfo)({
    id: 1,
    noteId: newNoteId(),
    privatePart: {
      commonFriends,
      verifiedCommonFriends,
      friendLevel: ['SECOND_DEGREE'],
      symmetricKey: 'symmetric-key',
    },
    publicPart: {
      notePublicKey: generatePrivateKey().publicKeyPemBase64,
      text: 'note',
      allowRepost: true,
    },
    expiresAt: 0,
    createdAt: new Date(0).toISOString(),
    modifiedAt: new Date(0).toISOString(),
  })
}

it('derives trusted friends for a note as a deduped, imported subset of common friends', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: noteWith(
        [imported],
        [importedTrusted, importedTrusted, notImportedTrusted]
      ),
      importedContactsHashes,
    })
  ).toEqual({
    commonFriends: [imported, importedTrusted],
    verifiedCommonFriends: [importedTrusted],
  })
})

it('derives no trusted friends for a note without them', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: noteWith([imported], []),
      importedContactsHashes,
    }).verifiedCommonFriends
  ).toEqual([])
})

it('dedupes trusted friends for chats', () => {
  expect(
    deriveVisibleCommonFriendsForChat({
      commonFriends: [importedTrusted],
      verifiedCommonFriends: [importedTrusted, importedTrusted],
      importedContactsHashes,
    })
  ).toEqual({
    commonFriends: [importedTrusted],
    verifiedCommonFriends: [importedTrusted],
  })
})
