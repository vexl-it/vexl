import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  type InvoiceId,
  InvoiceStatusType,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, Schema} from 'effect'
import {DateTime} from 'luxon'

export const createInvoiceRecordKey = (invoiceId: InvoiceId): string =>
  `invoice:${invoiceId}`

export interface UpdateInvoiceStateWebhookOperations {
  createOrUpdateInvoiceState: (args: {
    invoiceId: InvoiceId
    type: InvoiceStatusType
  }) => Effect.Effect<void, UnexpectedServerError>
  getInvoiceStatusType: (args: {
    invoiceId: InvoiceId
  }) => Effect.Effect<InvoiceStatusType, UnexpectedServerError | NotFoundError>
}

export class UpdateInvoiceStateWebhookService extends Context.Tag(
  'UpdateInvoiceStateWebhookService'
)<UpdateInvoiceStateWebhookService, UpdateInvoiceStateWebhookOperations>() {
  static readonly Live = Layer.effect(
    UpdateInvoiceStateWebhookService,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)

      const toReturn: UpdateInvoiceStateWebhookOperations = {
        createOrUpdateInvoiceState: ({invoiceId, type}) =>
          Effect.gen(function* (_) {
            const invoiceRecordKey = createInvoiceRecordKey(invoiceId)
            const expiresAt = Schema.decodeSync(UnixMillisecondsE)(
              DateTime.now().plus({days: 1}).toMillis()
            )

            yield* _(
              redis.set(InvoiceStatusType)(invoiceRecordKey, type, {
                expiresAt,
              })
            )
          }).pipe(
            Effect.catchAll(
              (e) =>
                new UnexpectedServerError({
                  status: 500,
                  detail: 'Error saving invoice state to redis',
                  cause: e,
                })
            )
          ),
        getInvoiceStatusType: ({invoiceId}) =>
          Effect.gen(function* (_) {
            const invoiceRecordKey = createInvoiceRecordKey(invoiceId)
            const invoiceState = yield* _(
              redis.get(InvoiceStatusType)(invoiceRecordKey)
            )

            return invoiceState
          }).pipe(
            Effect.catchAll(
              (
                e
              ): Effect.Effect<
                never,
                UnexpectedServerError | NotFoundError
              > => {
                if (
                  e._tag === 'RecordDoesNotExistsReddisError' ||
                  e._tag === 'RedisError'
                )
                  return Effect.zipLeft(
                    Effect.fail(
                      new NotFoundError({
                        status: 404,
                        message:
                          'Entry not found in redis and failed to fetch from BTC pay server',
                      })
                    ),
                    Effect.logError('Entry not found in redis error', e)
                  )

                return Effect.zipLeft(
                  Effect.fail(
                    new UnexpectedServerError({
                      status: 500,
                      detail: 'Redis error when reading value of invoice state',
                      cause: e,
                    })
                  ),
                  Effect.logError(
                    'Redis error when reading value of invoice state',
                    e
                  )
                )
              }
            )
          ),
      } satisfies UpdateInvoiceStateWebhookOperations

      return toReturn
    })
  )
}
