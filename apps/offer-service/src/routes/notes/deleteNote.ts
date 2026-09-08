import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

export const deleteNote = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'deleteNote',
  (req) =>
    Effect.gen(function* () {
      const noteDb = yield* NoteDbService
      const hashedAdminIds = yield* Effect.forEach(
        req.query.adminIds,
        hashNoteAdminId
      )

      // note_private.note_id is a FK with ON DELETE CASCADE, so removing the
      // public rows also removes all direct and reposted private parts.
      yield* Effect.forEach(hashedAdminIds, noteDb.deleteNotePublicPart, {})

      return {}
    }).pipe(
      withDbTransaction,
      withNoteAdminActionRedisLock([...req.query.adminIds]),
      makeEndpointEffect
    )
)
