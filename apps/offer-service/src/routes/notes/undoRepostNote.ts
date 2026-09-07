import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteRepostId} from '../../utils/hashNoteIds'
import {withNoteRepostActionRedisLock} from '../../utils/withNoteRedisLock'

export const undoRepostNote = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'undoRepostNote',
  (req) =>
    Effect.gen(function* () {
      const noteDb = yield* NoteDbService
      const hashedRepostIds = yield* Effect.forEach(
        req.query.repostIds,
        hashNoteRepostId
      )

      yield* Effect.forEach(
        hashedRepostIds,
        noteDb.deleteNotePrivatePartsByRepostId,
        {}
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock([...req.query.repostIds]),
      makeEndpointEffect
    )
)
