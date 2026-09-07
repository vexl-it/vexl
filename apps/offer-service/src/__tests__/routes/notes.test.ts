import {
  generateNoteAdminId,
  generateNoteRepostId,
  newNoteId,
  type NoteAdminId,
} from '@vexl-next/domain/src/general/notes'
import {
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  CanNotDeletePrivatePartOfAuthor,
  DuplicatedPublicKeyError,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {
  InvalidNoteExpirationError,
  ReportNoteLimitReachedError,
  type CreateNewNoteRequest,
  type ServerNote,
  type ServerNotePrivatePart,
} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const VALID_EXPIRATION = (): ReturnType<typeof unixMillisecondsFromNow> =>
  unixMillisecondsFromNow(3 * 24 * 60 * 60 * 1000)

interface CreateNoteParams {
  owner: MockedUser
  privateParts: readonly ServerNotePrivatePart[]
  adminId?: NoteAdminId
  expiresAt?: ReturnType<typeof unixMillisecondsFromNow>
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createNote = (params: CreateNoteParams) =>
  Effect.gen(function* () {
    const client = yield* NodeTestingApp
    const {
      owner,
      privateParts,
      adminId = generateNoteAdminId(),
      expiresAt = VALID_EXPIRATION(),
    } = params

    const request: CreateNewNoteRequest = {
      noteId: newNoteId(),
      adminId,
      payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
      notePrivateList: privateParts,
      expiresAt,
    }

    yield* setAuthHeaders(owner.authHeaders)
    const headers = makeTestCommonAndSecurityHeaders(owner.authHeaders)

    const response = yield* client.Notes.createNewNote({
      payload: request,
      headers,
    })

    return {...response, adminId}
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const fetchNotesForMe = (user: MockedUser) =>
  Effect.gen(function* () {
    const client = yield* NodeTestingApp
    yield* setAuthHeaders(user.authHeaders)
    const headers = makeTestCommonAndSecurityHeaders(user.authHeaders)
    return yield* client.Notes.getNotesForMeModifiedOrCreatedAfterPaginated({
      query: {limit: 100},
      headers,
    })
  })

const privatePartFor = (
  user: MockedUser,
  payload: string
): ServerNotePrivatePart => ({
  userPublicKey: user.mainKeyPair.publicKeyPemBase64,
  payloadPrivate: payload as PrivatePayloadEncrypted,
})

describe('Create note and fetch it', () => {
  it('Creates a note and returns owners own private payload', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000001')
        const recipient = yield* createMockedUser('+420733000002')

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipientPayload'),
            privatePartFor(me, '0ownerPayload'),
          ],
        })

        expect(note.noteId).toBeDefined()
        expect(note.privatePayload).toEqual('0ownerPayload')
        expect(note.publicPayload).toEqual('payloadPublic')
        expect(note.id).toBeDefined()

        const sql = yield* SqlClient.SqlClient
        const publicInDb = yield* sql`
          SELECT
            *
          FROM
            note_public
          WHERE
            note_id = ${note.noteId}
        `
        expect(publicInDb).toHaveLength(1)

        const privateInDb = yield* sql`
          SELECT
            *
          FROM
            note_private
          WHERE
            note_id = ${publicInDb[0].id ?? ''}
        `
        expect(privateInDb).toHaveLength(2)
      })
    )
  })

  it('Recipient sees the note in getNotesForMe with its own private payload', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000011')
        const recipient = yield* createMockedUser('+420733000012')

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipientPayload'),
            privatePartFor(me, '0ownerPayload'),
          ],
        })

        const forRecipient = yield* fetchNotesForMe(recipient)
        const matching = forRecipient.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(matching).toHaveLength(1)
        expect(matching[0]?.privatePayload).toEqual('0recipientPayload')

        const forOwner = yield* fetchNotesForMe(me)
        const ownerMatching = forOwner.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(ownerMatching).toHaveLength(1)
        expect(ownerMatching[0]?.privatePayload).toEqual('0ownerPayload')
      })
    )
  })

  it('Fails when owners own private part is missing', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000021')
        const recipient = yield* createMockedUser('+420733000022')

        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)
        const headers = makeTestCommonAndSecurityHeaders(me.authHeaders)

        const response = yield* pipe(
          client.Notes.createNewNote({
            payload: {
              noteId: newNoteId(),
              adminId: generateNoteAdminId(),
              payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
              notePrivateList: [privatePartFor(recipient, '0recipient')],
              expiresAt: VALID_EXPIRATION(),
            },
            headers,
          }),
          Effect.result
        )

        expect(response._tag).toBe('Failure')
      })
    )
  })

  it('Fails when duplicated public key within the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000031')
        const recipient = yield* createMockedUser('+420733000032')

        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)
        const headers = makeTestCommonAndSecurityHeaders(me.authHeaders)

        const response = yield* pipe(
          client.Notes.createNewNote({
            payload: {
              noteId: newNoteId(),
              adminId: generateNoteAdminId(),
              payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
              notePrivateList: [
                privatePartFor(recipient, '0recipient'),
                privatePartFor(recipient, '0recipientDuplicate'),
                privatePartFor(me, '0owner'),
              ],
              expiresAt: VALID_EXPIRATION(),
            },
            headers,
          }),
          Effect.result
        )

        expectErrorResponse(DuplicatedPublicKeyError)(response)
      })
    )
  })
})

describe('Note expiration validation', () => {
  it('Rejects an expiration in the past', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000041')
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)
        const headers = makeTestCommonAndSecurityHeaders(me.authHeaders)

        const response = yield* pipe(
          client.Notes.createNewNote({
            payload: {
              noteId: newNoteId(),
              adminId: generateNoteAdminId(),
              payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
              notePrivateList: [privatePartFor(me, '0owner')],
              expiresAt: unixMillisecondsFromNow(-10_000),
            },
            headers,
          }),
          Effect.result
        )

        expectErrorResponse(InvalidNoteExpirationError)(response)
      })
    )
  })

  it('Rejects an expiration further than the allowed maximum', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000051')
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)
        const headers = makeTestCommonAndSecurityHeaders(me.authHeaders)

        const response = yield* pipe(
          client.Notes.createNewNote({
            payload: {
              noteId: newNoteId(),
              adminId: generateNoteAdminId(),
              payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
              notePrivateList: [privatePartFor(me, '0owner')],
              expiresAt: unixMillisecondsFromNow(30 * 24 * 60 * 60 * 1000),
            },
            headers,
          }),
          Effect.result
        )

        expectErrorResponse(InvalidNoteExpirationError)(response)
      })
    )
  })
})

describe('Delete note', () => {
  it('Deleting the note cascades to reposted private parts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000061')
        const reposter = yield* createMockedUser('+420733000062')
        const repostRecipient = yield* createMockedUser('+420733000063')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reposter, '0reposter'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.repostNote({
          payload: {
            noteId: note.noteId,
            repostId: generateNoteRepostId(),
            notePrivateList: [
              privatePartFor(repostRecipient, '0repostRecipient'),
            ],
          },
          headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
        })

        const sql = yield* SqlClient.SqlClient
        const beforeDelete = yield* sql`
          SELECT
            note_private.*
          FROM
            note_private
            INNER JOIN note_public ON note_public.id = note_private.note_id
          WHERE
            note_public.note_id = ${note.noteId}
        `
        expect(beforeDelete.length).toEqual(3)

        yield* setAuthHeaders(me.authHeaders)
        yield* client.Notes.deleteNote({query: {adminIds: [note.adminId]}})

        const publicAfter = yield* sql`
          SELECT
            *
          FROM
            note_public
          WHERE
            note_id = ${note.noteId}
        `
        expect(publicAfter.length).toEqual(0)

        const privateAfter = yield* sql`
          SELECT
            *
          FROM
            note_private
          WHERE
            repost_id IS NOT NULL
        `
        expect(privateAfter.length).toEqual(0)
      })
    )
  })

  it('Does not fail when deleting a non existing note', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000071')
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        yield* client.Notes.deleteNote({
          query: {adminIds: [generateNoteAdminId()]},
        })
      })
    )
  })
})

describe('Delete note private part', () => {
  it('Removes access for the given public key and keeps the other parts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000141')
        const removedContact = yield* createMockedUser('+420733000142')
        const keptContact = yield* createMockedUser('+420733000143')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(removedContact, '0removed'),
            privatePartFor(keptContact, '0kept'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(me.authHeaders)
        yield* client.Notes.deleteNotePrivatePart({
          payload: {
            adminIds: [note.adminId],
            publicKeys: [removedContact.mainKeyPair.publicKeyPemBase64],
          },
          headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
        })

        // Removed contact lost access.
        const forRemoved = yield* fetchNotesForMe(removedContact)
        expect(
          forRemoved.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(0)

        // Kept contact still sees the note.
        const forKept = yield* fetchNotesForMe(keptContact)
        expect(
          forKept.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(1)

        // Owner part is untouched.
        const forOwner = yield* fetchNotesForMe(me)
        const ownerMatching = forOwner.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(ownerMatching).toHaveLength(1)
        expect(ownerMatching[0]?.privatePayload).toEqual('0owner')
      })
    )
  })

  it('Keeps reposted private parts of the removed public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000151')
        const reposter = yield* createMockedUser('+420733000152')
        const directAndRepost = yield* createMockedUser('+420733000153')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reposter, '0reposter'),
            privatePartFor(directAndRepost, '0direct'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.repostNote({
          payload: {
            noteId: note.noteId,
            repostId: generateNoteRepostId(),
            notePrivateList: [
              privatePartFor(directAndRepost, '0directViaRepost'),
            ],
          },
          headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
        })

        yield* setAuthHeaders(me.authHeaders)
        yield* client.Notes.deleteNotePrivatePart({
          payload: {
            adminIds: [note.adminId],
            publicKeys: [directAndRepost.mainKeyPair.publicKeyPemBase64],
          },
          headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
        })

        // The direct part is gone but the reposted one remains.
        const forDirectAndRepost = yield* fetchNotesForMe(directAndRepost)
        const matching = forDirectAndRepost.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(matching).toHaveLength(1)
        expect(matching[0]?.privatePayload).toEqual('0directViaRepost')
      })
    )
  })

  it('Refuses to delete the private part of the author', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000161')
        const recipient = yield* createMockedUser('+420733000162')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipient'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(me.authHeaders)
        const response = yield* pipe(
          client.Notes.deleteNotePrivatePart({
            payload: {
              adminIds: [note.adminId],
              publicKeys: [me.mainKeyPair.publicKeyPemBase64],
            },
            headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
          }),
          Effect.result
        )

        expectErrorResponse(CanNotDeletePrivatePartOfAuthor)(response)

        // Nothing was deleted.
        const forOwner = yield* fetchNotesForMe(me)
        expect(
          forOwner.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(1)
      })
    )
  })

  it('Does nothing when the adminId does not match any note', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000171')
        const recipient = yield* createMockedUser('+420733000172')
        const stranger = yield* createMockedUser('+420733000173')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipient'),
            privatePartFor(me, '0owner'),
          ],
        })

        // A user without the note's adminId cannot remove anything.
        yield* setAuthHeaders(stranger.authHeaders)
        yield* client.Notes.deleteNotePrivatePart({
          payload: {
            adminIds: [generateNoteAdminId()],
            publicKeys: [recipient.mainKeyPair.publicKeyPemBase64],
          },
          headers: makeTestCommonAndSecurityHeaders(stranger.authHeaders),
        })

        const forRecipient = yield* fetchNotesForMe(recipient)
        expect(
          forRecipient.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(1)
      })
    )
  })
})

describe('Repost and undo repost', () => {
  it('Reposts to new recipients and undo removes only the reposted parts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000081')
        const reposter = yield* createMockedUser('+420733000082')
        const directAndRepost = yield* createMockedUser('+420733000083')
        const repostOnly = yield* createMockedUser('+420733000084')
        const client = yield* NodeTestingApp

        // directAndRepost receives the note directly from the author.
        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reposter, '0reposter'),
            privatePartFor(directAndRepost, '0direct'),
            privatePartFor(me, '0owner'),
          ],
        })

        const repostId = generateNoteRepostId()
        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.repostNote({
          payload: {
            noteId: note.noteId,
            repostId,
            notePrivateList: [
              privatePartFor(directAndRepost, '0directViaRepost'),
              privatePartFor(repostOnly, '0repostOnly'),
            ],
          },
          headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
        })

        // repostOnly can now see the note.
        const repostOnlyBefore = yield* fetchNotesForMe(repostOnly)
        expect(
          repostOnlyBefore.items.filter(
            (n: ServerNote) => n.noteId === note.noteId
          )
        ).toHaveLength(1)

        // directAndRepost sees it twice (direct + repost), by design.
        const directBefore = yield* fetchNotesForMe(directAndRepost)
        expect(
          directBefore.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(2)

        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.undoRepostNote({query: {repostIds: [repostId]}})

        // repostOnly lost access.
        const repostOnlyAfter = yield* fetchNotesForMe(repostOnly)
        expect(
          repostOnlyAfter.items.filter(
            (n: ServerNote) => n.noteId === note.noteId
          )
        ).toHaveLength(0)

        // directAndRepost keeps the directly delivered access.
        const directAfter = yield* fetchNotesForMe(directAndRepost)
        const directAfterMatching = directAfter.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(directAfterMatching).toHaveLength(1)
        expect(directAfterMatching[0]?.privatePayload).toEqual('0direct')
      })
    )
  })

  it('Reposting a non existing note returns 404', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const reposter = yield* createMockedUser('+420733000091')
        const recipient = yield* createMockedUser('+420733000092')
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(reposter.authHeaders)

        const response = yield* pipe(
          client.Notes.repostNote({
            payload: {
              noteId: newNoteId(),
              repostId: generateNoteRepostId(),
              notePrivateList: [privatePartFor(recipient, '0recipient')],
            },
            headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
          }),
          Effect.result
        )

        expect(response._tag).toBe('Failure')
        if (response._tag === 'Failure') {
          expect(response.failure).toHaveProperty('status', 404)
        }
      })
    )
  })
})

describe('Create repost note private part', () => {
  it('Adds a new recipient to an existing repost and undo removes it too', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000141')
        const reposter = yield* createMockedUser('+420733000142')
        const firstRecipient = yield* createMockedUser('+420733000143')
        const lateRecipient = yield* createMockedUser('+420733000144')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reposter, '0reposter'),
            privatePartFor(me, '0owner'),
          ],
        })

        const repostId = generateNoteRepostId()
        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.repostNote({
          payload: {
            noteId: note.noteId,
            repostId,
            notePrivateList: [privatePartFor(firstRecipient, '0first')],
          },
          headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
        })

        // lateRecipient does not see the note yet.
        const lateBefore = yield* fetchNotesForMe(lateRecipient)
        expect(
          lateBefore.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(0)

        // Reposter adds a private part for a newly imported contact.
        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.createRepostNotePrivatePart({
          payload: {
            repostId,
            notePrivateList: [privatePartFor(lateRecipient, '0late')],
          },
        })

        // lateRecipient now receives the note via the paginated feed.
        const lateAfter = yield* fetchNotesForMe(lateRecipient)
        const lateMatching = lateAfter.items.filter(
          (n: ServerNote) => n.noteId === note.noteId
        )
        expect(lateMatching).toHaveLength(1)
        expect(lateMatching[0]?.privatePayload).toEqual('0late')

        // Undo repost removes both the original and the added repost parts.
        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.undoRepostNote({query: {repostIds: [repostId]}})

        const firstAfterUndo = yield* fetchNotesForMe(firstRecipient)
        expect(
          firstAfterUndo.items.filter(
            (n: ServerNote) => n.noteId === note.noteId
          )
        ).toHaveLength(0)
        const lateAfterUndo = yield* fetchNotesForMe(lateRecipient)
        expect(
          lateAfterUndo.items.filter(
            (n: ServerNote) => n.noteId === note.noteId
          )
        ).toHaveLength(0)

        const sql = yield* SqlClient.SqlClient
        const repostPartsInDb = yield* sql`
          SELECT
            note_private.*
          FROM
            note_private
            INNER JOIN note_public ON note_public.id = note_private.note_id
          WHERE
            note_private.repost_id IS NOT NULL
            AND note_public.note_id = ${note.noteId}
        `
        expect(repostPartsInDb).toHaveLength(0)
      })
    )
  })

  it('Returns 404 for an unknown repostId', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const reposter = yield* createMockedUser('+420733000151')
        const recipient = yield* createMockedUser('+420733000152')
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(reposter.authHeaders)

        const response = yield* pipe(
          client.Notes.createRepostNotePrivatePart({
            payload: {
              repostId: generateNoteRepostId(),
              notePrivateList: [privatePartFor(recipient, '0recipient')],
            },
          }),
          Effect.result
        )

        expect(response._tag).toBe('Failure')
        if (response._tag === 'Failure') {
          expect(response.failure).toHaveProperty('status', 404)
        }
      })
    )
  })

  it('Fails when duplicated public key within the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000161')
        const reposter = yield* createMockedUser('+420733000162')
        const recipient = yield* createMockedUser('+420733000163')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reposter, '0reposter'),
            privatePartFor(me, '0owner'),
          ],
        })

        const repostId = generateNoteRepostId()
        yield* setAuthHeaders(reposter.authHeaders)
        yield* client.Notes.repostNote({
          payload: {
            noteId: note.noteId,
            repostId,
            notePrivateList: [privatePartFor(recipient, '0recipient')],
          },
          headers: makeTestCommonAndSecurityHeaders(reposter.authHeaders),
        })

        const response = yield* pipe(
          client.Notes.createRepostNotePrivatePart({
            payload: {
              repostId,
              notePrivateList: [
                privatePartFor(recipient, '0recipient'),
                privatePartFor(recipient, '0recipientDuplicate'),
              ],
            },
          }),
          Effect.result
        )

        expectErrorResponse(DuplicatedPublicKeyError)(response)
      })
    )
  })
})

describe('Get removed notes', () => {
  it('Reports deleted and expired notes as removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000101')
        const recipient = yield* createMockedUser('+420733000102')
        const client = yield* NodeTestingApp
        const sql = yield* SqlClient.SqlClient

        const noteToDelete = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipient'),
            privatePartFor(me, '0owner'),
          ],
        })
        const noteToExpire = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipient'),
            privatePartFor(me, '0owner'),
          ],
        })

        const knownIds = [noteToDelete.noteId, noteToExpire.noteId]

        // Nothing removed yet.
        yield* setAuthHeaders(recipient.authHeaders)
        const recipientHeaders = makeTestCommonAndSecurityHeaders(
          recipient.authHeaders
        )
        const removedInitial = yield* client.Notes.getRemovedNotes({
          payload: {noteIds: knownIds},
          headers: recipientHeaders,
        })
        expect(removedInitial.noteIds).toEqual([])

        // Delete one, expire the other.
        yield* setAuthHeaders(me.authHeaders)
        yield* client.Notes.deleteNote({
          query: {adminIds: [noteToDelete.adminId]},
        })
        yield* sql`
          UPDATE note_public
          SET
            expires_at = now() - interval '1 hour'
          WHERE
            note_id = ${noteToExpire.noteId}
        `

        yield* setAuthHeaders(recipient.authHeaders)
        const removedAfter = yield* client.Notes.getRemovedNotes({
          payload: {noteIds: knownIds},
          headers: recipientHeaders,
        })
        expect([...removedAfter.noteIds].sort()).toEqual([...knownIds].sort())
      })
    )
  })
})

describe('Report note', () => {
  it('Increments the report counter and hides the note over threshold', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000111')
        const reporter = yield* createMockedUser('+420733000112')
        const client = yield* NodeTestingApp
        const sql = yield* SqlClient.SqlClient

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reporter, '0reporter'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(reporter.authHeaders)
        yield* client.Notes.reportNote({
          payload: {noteId: note.noteId},
          headers: makeTestCommonAndSecurityHeaders(reporter.authHeaders),
        })

        const reportedInDb = yield* sql`
          SELECT
            report
          FROM
            note_public
          WHERE
            note_id = ${note.noteId}
        `
        expect(reportedInDb.at(0)).toHaveProperty('report', 1)

        // Over threshold (OFFER_REPORT_FILTER=1): recipient no longer sees it.
        const forReporter = yield* fetchNotesForMe(reporter)
        expect(
          forReporter.items.filter((n: ServerNote) => n.noteId === note.noteId)
        ).toHaveLength(0)
      })
    )
  })

  it('Returns 404 when the note is not for the reporter', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000121')
        const recipient = yield* createMockedUser('+420733000122')
        const stranger = yield* createMockedUser('+420733000123')
        const client = yield* NodeTestingApp

        const note = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(recipient, '0recipient'),
            privatePartFor(me, '0owner'),
          ],
        })

        yield* setAuthHeaders(stranger.authHeaders)
        const response = yield* pipe(
          client.Notes.reportNote({
            payload: {noteId: note.noteId},
            headers: makeTestCommonAndSecurityHeaders(stranger.authHeaders),
          }),
          Effect.result
        )

        expect(response._tag).toBe('Failure')
        if (response._tag === 'Failure') {
          expect(response.failure).toHaveProperty('status', 404)
        }
      })
    )
  })

  it('Returns an error when the report limit is reached', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = yield* createMockedUser('+420733000131')
        const reporter = yield* createMockedUser('+420733000132')
        const client = yield* NodeTestingApp

        const note1 = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reporter, '0reporter'),
            privatePartFor(me, '0owner'),
          ],
        })
        const note2 = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reporter, '0reporter'),
            privatePartFor(me, '0owner'),
          ],
        })
        const note3 = yield* createNote({
          owner: me,
          privateParts: [
            privatePartFor(reporter, '0reporter'),
            privatePartFor(me, '0owner'),
          ],
        })

        const reporterHeaders = makeTestCommonAndSecurityHeaders(
          reporter.authHeaders
        )
        yield* setAuthHeaders(reporter.authHeaders)

        yield* client.Notes.reportNote({
          payload: {noteId: note1.noteId},
          headers: reporterHeaders,
        })
        yield* client.Notes.reportNote({
          payload: {noteId: note2.noteId},
          headers: reporterHeaders,
        })

        const response = yield* pipe(
          client.Notes.reportNote({
            payload: {noteId: note3.noteId},
            headers: reporterHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(ReportNoteLimitReachedError)(response)
      })
    )
  })
})
