import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NOTE_MAX_EXPIRATION_DAYS} from '@vexl-next/domain/src/general/notes'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {InvalidNoteExpirationError} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {notePartsToServerNote} from '../../utils/notePartsToServerNote'
import {validatePrivatePartsWhenSavingAll} from '../../utils/validatePrivatePartsWhenSavingAll'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

const ONE_HOUR_IN_MS = 60 * 60 * 1000
const MAX_EXPIRATION_IN_MS =
  NOTE_MAX_EXPIRATION_DAYS * 24 * 60 * 60 * 1000 + ONE_HOUR_IN_MS

export const createNewNote = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'createNewNote',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const noteDb = yield* _(NoteDbService)

      const nowMs = Date.now()
      if (
        req.payload.expiresAt <= nowMs ||
        req.payload.expiresAt > nowMs + MAX_EXPIRATION_IN_MS
      ) {
        return yield* _(
          Effect.fail(new InvalidNoteExpirationError({status: 400}))
        )
      }

      yield* _(
        validatePrivatePartsWhenSavingAll({
          ownersPublicKey: Option.getOrElse(
            security.publicKeyV2,
            () => security.publicKey
          ),
          privateParts: req.payload.notePrivateList,
        })
      )

      const hashedAdminId = yield* _(hashNoteAdminId(req.payload.adminId))

      const insertedNote = yield* _(
        noteDb.insertNotePublicPart({
          adminId: hashedAdminId,
          noteId: req.payload.noteId,
          payloadPublic: req.payload.payloadPublic,
          expiresAt: new Date(req.payload.expiresAt),
        })
      )

      yield* _(
        Effect.forEach(
          req.payload.notePrivateList,
          (privatePart) =>
            noteDb.insertNotePrivatePart({
              ...privatePart,
              noteId: insertedNote.id,
              repostId: null,
            }),
          {batching: true}
        )
      )

      return yield* _(
        noteDb.queryNoteByPublicKeyAndNoteId({
          id: insertedNote.noteId,
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
          skipValidation: true,
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.zipRight(
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
