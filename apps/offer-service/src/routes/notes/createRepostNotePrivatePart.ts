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
import {replaceNotePrivateParts} from './utils/replaceNotePrivateParts'

const isWithoutDuplicates = (
  privateList: readonly ServerNotePrivatePart[]
): boolean => {
  const deduped = Array.dedupeWith<readonly ServerNotePrivatePart[]>(
    (a, b) => a.userPublicKey === b.userPublicKey
  )(privateList)

  return Array.length(deduped) === Array.length(privateList)
}

export const createRepostNotePrivatePart = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'createRepostNotePrivatePart',
  (req) =>
    Effect.gen(function* (_) {
      const noteDb = yield* _(NoteDbService)

      if (!isWithoutDuplicates(req.payload.notePrivateList)) {
        return yield* _(
          Effect.fail(new DuplicatedPublicKeyError({status: 400}))
        )
      }

      const hashedRepostId = yield* _(hashNoteRepostId(req.payload.repostId))

      const noteId = yield* _(noteDb.queryNoteIdByRepostId(hashedRepostId))
      if (Option.isNone(noteId)) {
        return yield* _(Effect.fail(new NotFoundError()))
      }

      yield* replaceNotePrivateParts(
        Array.map(req.payload.notePrivateList, (part) => ({
          ...part,
          noteId: noteId.value,
          repostId: hashedRepostId,
        }))
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock(req.payload.repostId),
      Effect.withSpan('createRepostNotePrivatePart'),
      makeEndpointEffect
    )
)
