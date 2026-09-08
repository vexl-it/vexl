import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {getNextMidnightOnSelectedDate} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  ImportContactsQuotaReachedError,
  InitialImportContactsQuotaReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, pipe, Schema} from 'effect'
import {DateTime} from 'luxon'
import {
  disableImportContactsQuotaConfig,
  importContactsCountQuotaConfig,
  importContactsResetAfterDaysQuotaConfig,
  initialImportContactsCountQuotaConfig,
} from '../../configs'
import {UserDbService} from '../../db/UserDbService'
import {type ServerHashedNumber} from '../../utils/serverHashContact'

export const ImportContactsQuotaRecord = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
)

export const createQuotaRecordKey = (
  hashedPhoneNumber: ServerHashedNumber
): string => `importContactsQuota:${hashedPhoneNumber}`

export interface ImportContactsQuotaOperations {
  checkAndIncrementImportContactsQuota: (
    hashedPhoneNumber: ServerHashedNumber
  ) => (
    numberOfNewImportedContacts: number
  ) => Effect.Effect<
    void,
    | UnexpectedServerError
    | ImportContactsQuotaReachedError
    | InitialImportContactsQuotaReachedError
  >
}

export class ImportContactsQuotaService extends Context.Service<
  ImportContactsQuotaService,
  ImportContactsQuotaOperations
>()('ImportContactsQuotaService') {
  static readonly Live = Layer.effect(
    ImportContactsQuotaService,
    Effect.gen(function* () {
      const redis = yield* RedisService
      const userDb = yield* UserDbService

      const quotaDisabled = yield* disableImportContactsQuotaConfig
      if (quotaDisabled) {
        yield* Effect.logWarning(
          'Import contacts quota is DISABLED (DISABLE_IMPORT_CONTACTS_QUOTA=true)'
        )
        return {
          checkAndIncrementImportContactsQuota: () => () => Effect.void,
        }
      }

      return {
        checkAndIncrementImportContactsQuota:
          (hashedPhoneNumber: ServerHashedNumber) =>
          (numberOfNewImportedContacts: number) =>
            Effect.gen(function* () {
              const quotaRecordKey = createQuotaRecordKey(hashedPhoneNumber)
              const user = yield* pipe(
                userDb.findUserByHash(hashedPhoneNumber),
                Effect.flatMap(Effect.fromOption)
              )

              const importContactsCountQuota =
                yield* importContactsCountQuotaConfig
              const importContactsResetAfterDaysQuota =
                yield* importContactsResetAfterDaysQuotaConfig
              const initialImportContactsCountQuota =
                yield* initialImportContactsCountQuotaConfig
              const alreadyImportedContactsCount = yield* pipe(
                redis.get(ImportContactsQuotaRecord)(quotaRecordKey),
                Effect.catchTag('NoSuchElementError', () => Effect.succeed(0))
              )
              const contactsCountToReachQuota =
                importContactsCountQuota - alreadyImportedContactsCount

              if (
                user.initialImportDone &&
                numberOfNewImportedContacts > contactsCountToReachQuota
              ) {
                return yield* Effect.fail(new ImportContactsQuotaReachedError())
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
                yield* userDb.updateUserInitialImportDone({
                  hash: hashedPhoneNumber,
                  initialImportDone: true,
                })

                if (
                  numberOfNewImportedContacts > initialImportContactsCountQuota
                ) {
                  return yield* Effect.fail(
                    new InitialImportContactsQuotaReachedError()
                  )
                }
              }

              const contactsCountToStore = user.initialImportDone
                ? newImportedContactsCount
                : 0

              return yield* redis.set(ImportContactsQuotaRecord)(
                quotaRecordKey,
                contactsCountToStore,
                {expiresAt}
              )
            }).pipe(
              Effect.catch(
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

                  return Effect.tap(
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
