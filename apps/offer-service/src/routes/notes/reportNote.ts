import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ReportNoteLimitReachedError} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {withRedisLockFromEffect} from '@vexl-next/server-utils/src/RedisService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {reportLimitCountConfig} from '../../configs'
import {NoteDbService} from '../../db/NoteDbService'

export const reportNote = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'reportNote',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const noteDb = yield* NoteDbService
      const reportLimitCount = yield* reportLimitCountConfig

      const noteForMe = yield* noteDb.queryNoteByPublicKeyAndNoteId({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
        id: req.payload.noteId,
      })

      if (Option.isNone(noteForMe)) {
        return yield* Effect.fail(new NotFoundError())
      }

      const numberOfReportsForUser =
        yield* noteDb.queryNumberOfNoteReportsForUser(security.publicKey)

      if (numberOfReportsForUser >= reportLimitCount) {
        return yield* Effect.fail(new ReportNoteLimitReachedError())
      }

      yield* noteDb.updateReportNote({
        userPublicKey: security.publicKey,
        noteId: req.payload.noteId,
      })

      yield* noteDb.insertNoteReportedRecord({
        userPublicKey: security.publicKey,
        reportedAt: new Date(),
      })

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
