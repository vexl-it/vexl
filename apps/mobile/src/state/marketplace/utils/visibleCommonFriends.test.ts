import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {NoteInfo} from '@vexl-next/domain/src/general/notes'
import {Schema} from 'effect'
import {
  applyTrustedFriendsFeatureFlag,
  deriveVisibleCommonFriendsForChat,
  deriveVisibleCommonFriendsForNote,
  getNoteVerifiedCommonFriends,
} from './visibleCommonFriends'

const commonFriend = Schema.decodeSync(HashedPhoneNumber)('common-friend')
const trustedFriend = Schema.decodeSync(HashedPhoneNumber)('trusted-friend')
const unknownFriend = Schema.decodeSync(HashedPhoneNumber)('unknown-friend')

it('hides trusted classification without losing common friends or mutating cached data', () => {
  const friends = deriveVisibleCommonFriendsForChat({
    commonFriends: [commonFriend],
    verifiedCommonFriends: [trustedFriend, unknownFriend],
    importedContactsHashes: [commonFriend, trustedFriend],
  })

  const hidden = applyTrustedFriendsFeatureFlag(friends, false)
  expect(hidden).toEqual({
    commonFriends: [commonFriend, trustedFriend],
    verifiedCommonFriends: [],
  })
  expect(hidden.commonFriends).toBe(friends.commonFriends)
  expect(applyTrustedFriendsFeatureFlag(friends, false)).toBe(hidden)

  const enabled = applyTrustedFriendsFeatureFlag(friends, true)
  expect(enabled).toBe(friends)
  expect(enabled.verifiedCommonFriends).toEqual([trustedFriend])
  expect(applyTrustedFriendsFeatureFlag(friends, false)).toBe(hidden)
})

function makeNote({
  commonFriends = [],
  verifiedCommonFriends,
  viaRepost = false,
}: {
  commonFriends?: readonly HashedPhoneNumber[]
  verifiedCommonFriends?: readonly HashedPhoneNumber[]
  viaRepost?: boolean
}): NoteInfo {
  return Schema.decodeUnknownSync(NoteInfo)({
    id: 1,
    noteId: 'da518798-45d4-4d09-9b12-de3fc9f19ec7',
    publicPart: {
      notePublicKey: 'public-key',
      text: 'note',
      allowRepost: true,
    },
    privatePart: {
      commonFriends,
      verifiedCommonFriends,
      friendLevel: ['SECOND_DEGREE'],
      symmetricKey: 'key',
      viaRepost,
    },
    expiresAt: 1,
    createdAt: '2026-10-01T00:00:00.000Z',
    modifiedAt: '2026-10-01T00:00:00.000Z',
  })
}

it('returns no verified friends for reposted notes', () => {
  const noteInfo = makeNote({
    verifiedCommonFriends: [trustedFriend],
    viaRepost: true,
  })
  expect(getNoteVerifiedCommonFriends(noteInfo.privatePart)).toEqual([])
})

it('returns the verified friends list for direct notes', () => {
  const noteInfo = makeNote({
    verifiedCommonFriends: [trustedFriend, unknownFriend],
  })
  expect(getNoteVerifiedCommonFriends(noteInfo.privatePart)).toBe(
    noteInfo.privatePart.verifiedCommonFriends
  )
})

it('filters both lists to imported contacts and includes trusted friends in common friends', () => {
  const result = deriveVisibleCommonFriendsForNote({
    noteInfo: makeNote({
      commonFriends: [commonFriend, trustedFriend, commonFriend, unknownFriend],
      verifiedCommonFriends: [trustedFriend, unknownFriend],
    }),
    importedContactsHashes: [commonFriend, trustedFriend],
  })
  expect(result).toEqual({
    commonFriends: [commonFriend, trustedFriend],
    verifiedCommonFriends: [trustedFriend],
  })
})

it('includes imported trusted friends even when absent from commonFriends', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: makeNote({verifiedCommonFriends: [trustedFriend]}),
      importedContactsHashes: [trustedFriend],
    })
  ).toEqual({
    commonFriends: [trustedFriend],
    verifiedCommonFriends: [trustedFriend],
  })
})

it('deduplicates trusted friends while preserving first-occurrence order', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: makeNote({
        verifiedCommonFriends: [trustedFriend, commonFriend, trustedFriend],
      }),
      importedContactsHashes: [commonFriend, trustedFriend],
    })
  ).toEqual({
    commonFriends: [trustedFriend, commonFriend],
    verifiedCommonFriends: [trustedFriend, commonFriend],
  })
})

it('shows no friends without matching imported contacts', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: makeNote({
        commonFriends: [commonFriend],
        verifiedCommonFriends: [trustedFriend],
      }),
      importedContactsHashes: [],
    })
  ).toEqual({commonFriends: [], verifiedCommonFriends: []})
})

it('ignores verified hashes on reposts, including hashes absent from commonFriends', () => {
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo: makeNote({
        commonFriends: [commonFriend],
        verifiedCommonFriends: [commonFriend, trustedFriend],
        viaRepost: true,
      }),
      importedContactsHashes: [commonFriend, trustedFriend],
    })
  ).toEqual({commonFriends: [commonFriend], verifiedCommonFriends: []})
})

it('defaults old notes to an empty verified list', () => {
  const noteInfo = makeNote({commonFriends: [commonFriend]})
  expect(noteInfo.privatePart.verifiedCommonFriends).toEqual([])
  expect(
    deriveVisibleCommonFriendsForNote({
      noteInfo,
      importedContactsHashes: [commonFriend],
    })
  ).toEqual({commonFriends: [commonFriend], verifiedCommonFriends: []})
})

it('memoizes per note and recomputes when the note or imported contacts change', () => {
  const noteInfo = makeNote({verifiedCommonFriends: [trustedFriend]})
  const input = {noteInfo, importedContactsHashes: [trustedFriend]}
  const first = deriveVisibleCommonFriendsForNote(input)
  expect(deriveVisibleCommonFriendsForNote(input)).toBe(first)
  expect(
    deriveVisibleCommonFriendsForNote({...input, noteInfo: {...noteInfo}})
  ).not.toBe(first)
  expect(
    deriveVisibleCommonFriendsForNote({...input, importedContactsHashes: []})
  ).toEqual({commonFriends: [], verifiedCommonFriends: []})
})
