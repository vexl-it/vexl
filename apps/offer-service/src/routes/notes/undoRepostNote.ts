import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteRepostId} from '../../utils/hashNoteIds'
import {withNoteRepostActionRedisLock} from '../../utils/withNoteRedisLock'

export const undoRepostNote = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'undoRepostNote',
  (req) =>
    Effect.gen(function* (_) {
      const noteDb = yield* _(NoteDbService)
      const hashedRepostIds = yield* _(
        Effect.forEach(req.urlParams.repostIds, hashNoteRepostId)
      )

      yield* _(
        Effect.forEach(
          hashedRepostIds,
          noteDb.deleteNotePrivatePartsByRepostId,
          {batching: true}
        )
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock([...req.urlParams.repostIds]),
      makeEndpointEffect
    )
)
