import {Schema} from '@effect/schema'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import getNextMidnightOnCurrentDate from '@vexl-next/server-utils/src/getNextMidnightOnCurrentDate'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer} from 'effect'
import {importContactsQuotaConfig} from '../../configs'

const ImportContactsQuotaRecord = Schema.Int.pipe(
  Schema.greaterThanOrEqualTo(0)
)

const createQuotaRecordKey = (hashedPhoneNumber: HashedPhoneNumber): string =>
  `importContactsQuota:${hashedPhoneNumber}`

const incrementImportContactsQuota =
  (hashedPhoneNumber: HashedPhoneNumber) =>
  (numberOfImportedContacts: number) =>
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const quotaRecordKey = createQuotaRecordKey(hashedPhoneNumber)
      const oldImportedContactsCount = yield* _(
        redis.get(ImportContactsQuotaRecord)(quotaRecordKey),
        Effect.catchTag('RecordDoesNotExistsReddisError', () =>
          Effect.succeed(0)
        )
      )

      const newImportedContactsCount =
        oldImportedContactsCount + numberOfImportedContacts

      const expiresAt = Schema.decodeSync(UnixMillisecondsE)(
        getNextMidnightOnCurrentDate()
      )

      return yield* _(
        redis.set(ImportContactsQuotaRecord)(
          quotaRecordKey,
          newImportedContactsCount,
          {expiresAt}
        )
      )
    }).pipe(
      Effect.catchAll((e) => {
        return Effect.zipLeft(
          Effect.fail(
            new UnexpectedServerError({status: 500, cause: 'RedisError'})
          ),
          Effect.logError('Error while incrementing import contacts quota', e)
        )
      })
    )

const getImportedContactsCountToReachQuotaForPhoneNumber =
  (hashedPhoneNumber: HashedPhoneNumber) => () =>
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const quotaRecordKey = createQuotaRecordKey(hashedPhoneNumber)
      const importContactsQuota = yield* _(importContactsQuotaConfig)
      const importedContactsCount = yield* _(
        redis.get(ImportContactsQuotaRecord)(quotaRecordKey),
        Effect.catchTag('RecordDoesNotExistsReddisError', () =>
          Effect.succeed(0)
        )
      )

      const remainingContacts = importContactsQuota - importedContactsCount
      // this should never be negative, but just in case to avoid false positives when used
      return remainingContacts < 0 ? 0 : remainingContacts
    }).pipe(
      Effect.catchAll((e) => {
        return Effect.zipLeft(
          Effect.fail(
            new UnexpectedServerError({status: 500, cause: 'RedisError'})
          ),
          Effect.logError(
            'Error while getting import contacts quota difference',
            e
          )
        )
      })
    )

const deleteImportContactsQuotaRecord =
  (hashedPhoneNumber: HashedPhoneNumber) => () =>
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const quotaRecordKey = createQuotaRecordKey(hashedPhoneNumber)
      return yield* _(redis.delete(quotaRecordKey)).pipe(
        Effect.catchAll((e) => {
          return Effect.zipLeft(
            Effect.fail(
              new UnexpectedServerError({status: 500, cause: 'RedisError'})
            ),
            Effect.logError(
              'Error while deleting import contacts quota difference',
              e
            )
          )
        })
      )
    })

export interface ImportContactsQuotaOperations {
  incrementImportContactsQuota: (
    hashedPhoneNumber: HashedPhoneNumber
  ) => (
    numberOfImportedContacts: number
  ) => Effect.Effect<void, UnexpectedServerError, RedisService>
  getImportedContactsCountToReachQuotaForPhoneNumber: (
    hashedPhoneNumber: HashedPhoneNumber
  ) => () => Effect.Effect<number, UnexpectedServerError, RedisService>
  deleteImportContactsQuotaRecord: (
    hashedPhoneNumber: HashedPhoneNumber
  ) => () => Effect.Effect<void, UnexpectedServerError, RedisService>
}

export class ImportContactsQuotaService extends Context.Tag(
  'ImportContactsQuotaService'
)<ImportContactsQuotaService, ImportContactsQuotaOperations>() {
  static readonly Live = Layer.effect(
    ImportContactsQuotaService,
    Effect.gen(function* (_) {
      return {
        getImportedContactsCountToReachQuotaForPhoneNumber:
          (hashedPhoneNumber) => () =>
            getImportedContactsCountToReachQuotaForPhoneNumber(
              hashedPhoneNumber
            )(),
        incrementImportContactsQuota:
          (hashedPhoneNumber) => (numberOfImportedContacts) =>
            incrementImportContactsQuota(hashedPhoneNumber)(
              numberOfImportedContacts
            ),
        deleteImportContactsQuotaRecord: (hashedPhoneNumber) => () =>
          deleteImportContactsQuotaRecord(hashedPhoneNumber)(),
      }
    })
  )
}
