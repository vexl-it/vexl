import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {DuplicatedPublicKeyError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteRepostId} from '../../utils/hashNoteIds'
import {withNoteRepostActionRedisLock} from '../../utils/withNoteRedisLock'

const isWithoutDuplicates = (
  privateList: readonly ServerNotePrivatePart[]
): boolean => {
  const deduped = Array.dedupeWith<readonly ServerNotePrivatePart[]>(
    (a, b) => a.userPublicKey === b.userPublicKey
  )(privateList)

  return Array.length(deduped) === Array.length(privateList)
}

export const repostNote = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'repostNote',
  (req) =>
    Effect.gen(function* (_) {
      const noteDb = yield* _(NoteDbService)

      if (!isWithoutDuplicates(req.payload.notePrivateList)) {
        return yield* _(
          Effect.fail(new DuplicatedPublicKeyError({status: 400}))
        )
      }

      const note = yield* _(
        noteDb.queryNotePublicPartByNoteId(req.payload.noteId)
      )
      if (Option.isNone(note)) {
        return yield* _(Effect.fail(new NotFoundError()))
      }

      const hashedRepostId = yield* _(hashNoteRepostId(req.payload.repostId))

      // Duplicates against already existing rows are allowed by design
      // (spec §4.6); the repost parts are tagged with the encrypted repostId
      // so the reposter can later undo exactly these rows.
      yield* _(
        Effect.forEach(
          req.payload.notePrivateList,
          (privatePart) =>
            noteDb.insertNotePrivatePart({
              ...privatePart,
              noteId: note.value.id,
              repostId: hashedRepostId,
            }),
          {batching: true}
        )
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock(req.payload.repostId),
      Effect.withSpan('repostNote'),
      makeEndpointEffect
    )
)
