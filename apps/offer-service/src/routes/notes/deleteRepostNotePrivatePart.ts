import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteRepostId} from '../../utils/hashNoteIds'
import {withNoteRepostActionRedisLock} from '../../utils/withNoteRedisLock'

export const deleteRepostNotePrivatePart = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'deleteRepostNotePrivatePart',
  (req) =>
    Effect.gen(function* () {
      const db = yield* NoteDbService
      const repostId = yield* hashNoteRepostId(req.payload.repostId)
      const noteId = yield* db.queryNoteIdByRepostId(repostId)
      if (Option.isSome(noteId)) {
        yield* Effect.forEach(
          req.payload.publicKeys,
          (userPublicKey) =>
            db.deleteNotePrivatePart({
              noteId: noteId.value,
              repostId,
              userPublicKey,
            }),
          {batching: true}
        )
      }
      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock(req.payload.repostId),
      Effect.withSpan('deleteRepostNotePrivatePart'),
      makeEndpointEffect
    )
)
