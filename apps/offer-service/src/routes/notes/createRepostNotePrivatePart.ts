import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {DuplicatedPublicKeyError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const createRepostNotePrivatePart = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'createRepostNotePrivatePart',
  (req) =>
    Effect.gen(function* () {
      const noteDb = yield* NoteDbService

      if (!isWithoutDuplicates(req.payload.notePrivateList)) {
        return yield* Effect.fail(new DuplicatedPublicKeyError({status: 400}))
      }

      const hashedRepostId = yield* hashNoteRepostId(req.payload.repostId)

      const noteId = yield* noteDb.queryNoteIdByRepostId(hashedRepostId)
      if (Option.isNone(noteId)) {
        return yield* Effect.fail(new NotFoundError())
      }

      // Duplicates against already existing rows are allowed by design
      // (spec §4.6). New rows carry the same encrypted repostId as the
      // original repost so undoRepostNote removes them all at once.
      yield* Effect.forEach(
        req.payload.notePrivateList,
        (privatePart) =>
          noteDb.insertNotePrivatePart({
            ...privatePart,
            noteId: noteId.value,
            repostId: hashedRepostId,
          }),
        {}
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock(req.payload.repostId),
      Effect.withSpan('createRepostNotePrivatePart'),
      makeEndpointEffect
    )
)
