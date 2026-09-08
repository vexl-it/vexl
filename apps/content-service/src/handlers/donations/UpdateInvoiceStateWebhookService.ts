import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
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

export class UpdateInvoiceStateWebhookService extends Context.Service<
  UpdateInvoiceStateWebhookService,
  UpdateInvoiceStateWebhookOperations
>()('UpdateInvoiceStateWebhookService') {
  static readonly Live = Layer.effect(
    UpdateInvoiceStateWebhookService,
    Effect.gen(function* () {
      const redis = yield* RedisService

      const toReturn: UpdateInvoiceStateWebhookOperations = {
        createOrUpdateInvoiceState: ({invoiceId, type}) =>
          Effect.gen(function* () {
            const invoiceRecordKey = createInvoiceRecordKey(invoiceId)
            const expiresAt = Schema.decodeSync(UnixMilliseconds)(
              DateTime.now().plus({days: 1}).toMillis()
            )

            yield* redis.set(InvoiceStatusType)(invoiceRecordKey, type, {
              expiresAt,
            })
          }).pipe(
            Effect.catch((e) =>
              Effect.fail(
                new UnexpectedServerError({
                  status: 500,
                  message: 'Error saving invoice state to redis',
                  cause: e,
                })
              )
            )
          ),
        getInvoiceStatusType: ({invoiceId}) =>
          Effect.gen(function* () {
            const invoiceRecordKey = createInvoiceRecordKey(invoiceId)
            const invoiceState =
              yield* redis.get(InvoiceStatusType)(invoiceRecordKey)

            return invoiceState
          }).pipe(
            Effect.catch(
              (
                e
              ): Effect.Effect<never, UnexpectedServerError | NotFoundError> =>
                e._tag === 'NoSuchElementError'
                  ? new NotFoundError({
                      status: 404,
                      message:
                        'Entry not found in redis and failed to fetch from BTC pay server',
                    })
                  : new UnexpectedServerError({
                      status: 500,
                      message:
                        'Redis error when reading value of invoice state',
                      cause: e,
                    })
            )
          ),
      } satisfies UpdateInvoiceStateWebhookOperations

      return toReturn
    })
  )
}
