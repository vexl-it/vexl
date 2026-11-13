import {KeyHolder} from '@vexl-next/cryptography'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  NoteInfo,
  type NotePrivatePart,
  type OneNoteInState,
} from '@vexl-next/domain/src/general/notes'
import {Schema} from 'effect'
import {mergeIncomingNotesToState} from './mergeIncomingNotesToState'

const hash = Schema.decodeSync(HashedPhoneNumber)
const mainIdentity = KeyHolder.generatePrivateKey().publicKeyPemBase64
const extraIdentity = KeyHolder.generatePrivateKey().publicKeyPemBase64

const makeNote = (privatePart: Partial<NotePrivatePart>): NoteInfo =>
  Schema.decodeUnknownSync(NoteInfo)({
    id: 1,
    noteId: 'da518798-45d4-4d09-9b12-de3fc9f19ec7',
    expiresAt: Date.now() + 86_400_000,
    createdAt: '2026-09-18T00:00:00.000Z',
    modifiedAt: '2026-09-18T00:00:00.000Z',
    publicPart: {
      notePublicKey: 'test-public-key',
      text: 'A note',
      allowRepost: true,
    },
    privatePart: {
      commonFriends: [],
      verifiedCommonFriends: [],
      friendLevel: ['SECOND_DEGREE'],
      symmetricKey: 'test-key',
      viaRepost: false,
      ...privatePart,
    },
  })

// Stored before phone numbers had their own keys
const legacyStored: OneNoteInState = {
  noteInfo: makeNote({
    commonFriends: [hash('a')],
    verifiedCommonFriends: [hash('a')],
  }),
  flags: {reported: true},
}

it('keeps what the main number knows when a part for an extra number arrives alone', () => {
  const [merged] = mergeIncomingNotesToState({
    storedNotes: [legacyStored],
    incomingNotes: [
      {
        identity: extraIdentity,
        noteInfo: makeNote({
          friendLevel: ['FIRST_DEGREE'],
          commonFriends: [hash('b')],
        }),
      },
    ],
    removedNoteIds: [],
    mainIdentity,
  })

  expect(merged?.flags).toBe(legacyStored.flags)
  expect(merged?.noteInfo.privatePart).toMatchObject({
    friendLevel: ['SECOND_DEGREE', 'FIRST_DEGREE'],
    commonFriends: [hash('a'), hash('b')],
    verifiedCommonFriends: [hash('a')],
    viaRepost: false,
  })
})

it('prefers a direct part of any number over reposts', () => {
  const [merged] = mergeIncomingNotesToState({
    storedNotes: [],
    incomingNotes: [
      {
        identity: mainIdentity,
        noteInfo: makeNote({friendLevel: ['NOT_SPECIFIED'], viaRepost: true}),
      },
      {
        identity: extraIdentity,
        noteInfo: makeNote({commonFriends: [hash('b')]}),
      },
    ],
    removedNoteIds: [],
    mainIdentity,
  })

  expect(merged?.noteInfo.privatePart).toMatchObject({
    friendLevel: ['SECOND_DEGREE'],
    commonFriends: [hash('b')],
    viaRepost: false,
  })
})

it('shows the friends of every number on a newly received note', () => {
  const [merged] = mergeIncomingNotesToState({
    storedNotes: [],
    incomingNotes: [
      {
        identity: mainIdentity,
        noteInfo: makeNote({
          commonFriends: [hash('a')],
          verifiedCommonFriends: [hash('a')],
        }),
      },
      {
        identity: extraIdentity,
        noteInfo: makeNote({
          friendLevel: ['FIRST_DEGREE'],
          commonFriends: [hash('b')],
        }),
      },
    ],
    removedNoteIds: [],
    mainIdentity,
  })

  expect(merged?.noteInfo.privatePart).toMatchObject({
    friendLevel: ['SECOND_DEGREE', 'FIRST_DEGREE'],
    commonFriends: [hash('a'), hash('b')],
    verifiedCommonFriends: [hash('a')],
  })
})

it('drops a note only once no number has a private part for it', () => {
  const noteId = legacyStored.noteInfo.noteId
  const [withBoth] = mergeIncomingNotesToState({
    storedNotes: [legacyStored],
    incomingNotes: [
      {identity: extraIdentity, noteInfo: makeNote({commonFriends: []})},
    ],
    removedNoteIds: [],
    mainIdentity,
  })
  if (!withBoth) throw new Error('Note expected')

  const [onlyExtra] = mergeIncomingNotesToState({
    storedNotes: [withBoth],
    incomingNotes: [],
    removedNoteIds: [{identity: mainIdentity, removedIds: [noteId]}],
    mainIdentity,
  })
  expect(onlyExtra?.noteInfo.privatePart.commonFriends).toEqual([])
  if (!onlyExtra) throw new Error('Note expected')

  expect(
    mergeIncomingNotesToState({
      storedNotes: [onlyExtra],
      incomingNotes: [],
      removedNoteIds: [{identity: extraIdentity, removedIds: [noteId]}],
      mainIdentity,
    })
  ).toEqual([])
})
