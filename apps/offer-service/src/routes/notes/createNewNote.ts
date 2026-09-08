import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NOTE_MAX_EXPIRATION_DAYS} from '@vexl-next/domain/src/general/notes'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {InvalidNoteExpirationError} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {notePartsToServerNote} from '../../utils/notePartsToServerNote'
import {validatePrivatePartsWhenSavingAll} from '../../utils/validatePrivatePartsWhenSavingAll'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

const ONE_HOUR_IN_MS = 60 * 60 * 1000
const MAX_EXPIRATION_IN_MS =
  NOTE_MAX_EXPIRATION_DAYS * 24 * 60 * 60 * 1000 + ONE_HOUR_IN_MS

export const createNewNote = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'createNewNote',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const noteDb = yield* NoteDbService

      const nowMs = Date.now()
      if (
        req.payload.expiresAt <= nowMs ||
        req.payload.expiresAt > nowMs + MAX_EXPIRATION_IN_MS
      ) {
        return yield* Effect.fail(new InvalidNoteExpirationError({status: 400}))
      }

      yield* validatePrivatePartsWhenSavingAll({
        ownersPublicKey: Option.getOrElse(
          security.publicKeyV2,
          () => security.publicKey
        ),
        privateParts: req.payload.notePrivateList,
      })

      const hashedAdminId = yield* hashNoteAdminId(req.payload.adminId)

      const insertedNote = yield* noteDb.insertNotePublicPart({
        adminId: hashedAdminId,
        noteId: req.payload.noteId,
        payloadPublic: req.payload.payloadPublic,
        expiresAt: new Date(req.payload.expiresAt),
      })

      yield* Effect.forEach(
        req.payload.notePrivateList,
        (privatePart) =>
          noteDb.insertNotePrivatePart({
            ...privatePart,
            noteId: insertedNote.id,
            repostId: null,
          }),
        {}
      )

      return yield* pipe(
        noteDb.queryNoteByPublicKeyAndNoteId({
          id: insertedNote.noteId,
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
          skipValidation: true,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () =>
          Effect.andThen(
            Effect.logError(
              'Error finding note in the database right after creating it. This should not happen.'
            ),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        ),
        Effect.map(notePartsToServerNote)
      )
    }).pipe(
      withDbTransaction,
      withNoteAdminActionRedisLock(req.payload.adminId),
      Effect.withSpan('createNewNote'),
      makeEndpointEffect
    )
)
