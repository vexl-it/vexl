import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {getNextMidnightOnSelectedDate} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  ImportContactsQuotaReachedError,
  InitialImportContactsQuotaReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, Schema} from 'effect'
import {DateTime} from 'luxon'
import {
  importContactsCountQuotaConfig,
  importContactsResetAfterDaysQuotaConfig,
  initialImportContactsCountQuotaConfig,
} from '../../configs'
import {UserDbService} from '../../db/UserDbService'

export const ImportContactsQuotaRecord = Schema.Int.pipe(
  Schema.greaterThanOrEqualTo(0)
)

export const createQuotaRecordKey = (
  hashedPhoneNumber: HashedPhoneNumber
): string => `importContactsQuota:${hashedPhoneNumber}`

export interface ImportContactsQuotaOperations {
  checkAndIncrementImportContactsQuota: (
    hashedPhoneNumber: HashedPhoneNumber
  ) => (
    numberOfNewImportedContacts: number
  ) => Effect.Effect<
    void,
    | UnexpectedServerError
    | ImportContactsQuotaReachedError
    | InitialImportContactsQuotaReachedError
  >
}

export class ImportContactsQuotaService extends Context.Tag(
  'ImportContactsQuotaService'
)<ImportContactsQuotaService, ImportContactsQuotaOperations>() {
  static readonly Live = Layer.effect(
    ImportContactsQuotaService,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const userDb = yield* _(UserDbService)

      return {
        checkAndIncrementImportContactsQuota:
          (hashedPhoneNumber) => (numberOfNewImportedContacts) =>
            Effect.gen(function* (_) {
              const quotaRecordKey = createQuotaRecordKey(hashedPhoneNumber)
              const user = yield* _(
                userDb.findUserByHash(hashedPhoneNumber),
                Effect.flatten
              )

              const importContactsCountQuota = yield* _(
                importContactsCountQuotaConfig
              )
              const importContactsResetAfterDaysQuota = yield* _(
                importContactsResetAfterDaysQuotaConfig
              )
              const initialImportContactsCountQuota = yield* _(
                initialImportContactsCountQuotaConfig
              )
              const alreadyImportedContactsCount = yield* _(
                redis.get(ImportContactsQuotaRecord)(quotaRecordKey),
                Effect.catchTag('RecordDoesNotExistsReddisError', () =>
                  Effect.succeed(0)
                )
              )
              const contactsCountToReachQuota =
                importContactsCountQuota - alreadyImportedContactsCount

              if (
                user.initialImportDone &&
                numberOfNewImportedContacts > contactsCountToReachQuota
              ) {
                return yield* _(
                  Effect.fail(new ImportContactsQuotaReachedError())
                )
              }

              const newImportedContactsCount =
                alreadyImportedContactsCount + numberOfNewImportedContacts

              const expiresAt = getNextMidnightOnSelectedDate(
                DateTime.now()
                  .plus({
                    days: importContactsResetAfterDaysQuota,
                  })
                  .toJSDate()
              )

              if (!user.initialImportDone) {
                yield* _(
                  userDb.updateUserInitialImportDone({
                    hash: hashedPhoneNumber,
                    initialImportDone: true,
                  })
                )

                if (
                  numberOfNewImportedContacts > initialImportContactsCountQuota
                ) {
                  return yield* _(
                    Effect.fail(new InitialImportContactsQuotaReachedError())
                  )
                }
              }

              const contactsCountToStore = user.initialImportDone
                ? newImportedContactsCount
                : 0

              return yield* _(
                redis.set(ImportContactsQuotaRecord)(
                  quotaRecordKey,
                  contactsCountToStore,
                  {expiresAt}
                )
              )
            }).pipe(
              Effect.catchAll(
                (
                  e
                ): Effect.Effect<
                  never,
                  | UnexpectedServerError
                  | ImportContactsQuotaReachedError
                  | InitialImportContactsQuotaReachedError
                > => {
                  if (
                    e._tag === 'ImportContactsQuotaReachedError' ||
                    e._tag === 'InitialImportContactsQuotaReachedError'
                  ) {
                    return Effect.fail(e)
                  }

                  return Effect.zipLeft(
                    Effect.fail(
                      new UnexpectedServerError({status: 500, cause: e})
                    ),
                    Effect.logError(
                      'Error while incrementing import contacts quota',
                      e
                    )
                  )
                }
              )
            ),
      }
    })
  )
}
