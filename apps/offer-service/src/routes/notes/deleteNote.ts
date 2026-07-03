import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

export const deleteNote = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'deleteNote',
  (req) =>
    Effect.gen(function* (_) {
      const noteDb = yield* _(NoteDbService)
      const hashedAdminIds = yield* _(
        Effect.forEach(req.urlParams.adminIds, hashNoteAdminId)
      )

      // note_private.note_id is a FK with ON DELETE CASCADE, so removing the
      // public rows also removes all direct and reposted private parts.
      yield* _(
        Effect.forEach(hashedAdminIds, noteDb.deleteNotePublicPart, {
          batching: true,
        })
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteAdminActionRedisLock([...req.urlParams.adminIds]),
      makeEndpointEffect
    )
)
