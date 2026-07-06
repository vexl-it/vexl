import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportNoteLimitReachedError} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {withRedisLockFromEffect} from '@vexl-next/server-utils/src/RedisService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {reportLimitCountConfig} from '../../configs'
import {NoteDbService} from '../../db/NoteDbService'

export const reportNote = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'reportNote',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const noteDb = yield* _(NoteDbService)
      const reportLimitCount = yield* _(reportLimitCountConfig)

      const noteForMe = yield* _(
        noteDb.queryNoteByPublicKeyAndNoteId({
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
          id: req.payload.noteId,
        })
      )

      if (Option.isNone(noteForMe)) {
        return yield* _(Effect.fail(new NotFoundError()))
      }

      const numberOfReportsForUser = yield* _(
        noteDb.queryNumberOfNoteReportsForUser(security.publicKey)
      )

      if (numberOfReportsForUser >= reportLimitCount) {
        return yield* _(Effect.fail(new ReportNoteLimitReachedError()))
      }

      yield* _(
        noteDb.updateReportNote({
          userPublicKey: security.publicKey,
          noteId: req.payload.noteId,
        })
      )

      yield* _(
        noteDb.insertNoteReportedRecord({
          userPublicKey: security.publicKey,
          reportedAt: new Date(),
        })
      )

      return {}
    }).pipe(
      withDbTransaction,
      withRedisLockFromEffect(
        CurrentSecurity.pipe(
          Effect.map((security) => `reportNote:${security.publicKey}`)
        ),
        500
      ),
      makeEndpointEffect
    )
)
