import {UnauthorizedError} from '@vexl-next/rest-api/src/Errors'
import {
  UpdateInvoiceStatusWebhookErrors,
  UpdateInvoiceStatusWebhookRequest,
  UpdateInvoiceWebhookError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {UpdateInvoiceStateWebhookEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import * as crypto from 'node:crypto'
import {btcPayServerWebhookSecretConfig} from '../../configs'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const updateInvoiceStateWebhook = Handler.make(
  UpdateInvoiceStateWebhookEndpoint,
  ({headers, body}) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const updateInvoiceStateWebhookService = yield* _(
          UpdateInvoiceStateWebhookService
        )
        const btcPayServerWebhookSecret = yield* _(
          btcPayServerWebhookSecretConfig
        )

        const {btcPayWebhookSignatureOrNone} = headers

        if (Option.isNone(btcPayWebhookSignatureOrNone))
          return Effect.fail(
            new UnauthorizedError({
              status: 401,
              message: 'Secret received from btc pay server is missing',
              cause: new Error(
                'Secret received from btc pay server is missing'
              ),
            })
          )

        const checksum = Buffer.from(btcPayWebhookSignatureOrNone.value)
        const expectedBtcPayServerSignature =
          `sha256=` +
          crypto
            .createHmac('sha256', btcPayServerWebhookSecret)
            .update(JSON.stringify(body, null, 2))
            .digest('hex')
        const digest = Buffer.from(expectedBtcPayServerSignature)

        if (
          checksum.length !== digest.length ||
          !crypto.timingSafeEqual(digest, checksum)
        )
          return yield* _(
            Effect.fail(
              new UnauthorizedError({
                status: 401,
                message: 'Invalid secret received from btc pay server',
                cause: new Error('Invalid secret received from btc pay server'),
              })
            )
          )

        const webhookPayload = yield* _(
          Schema.decodeUnknown(UpdateInvoiceStatusWebhookRequest)(body),
          Effect.mapError(
            (e) =>
              new UpdateInvoiceWebhookError({
                cause: e,
                status: 400,
                message: 'Invalid webhook payload error',
              })
          )
        )

        yield* _(
          updateInvoiceStateWebhookService.createOrUpdateInvoiceState({
            invoiceId: webhookPayload.invoiceId,
            type: webhookPayload.type,
          })
        )

        return {}
      }).pipe(Effect.withSpan('updateInvoiceStateWebhook')),
      UpdateInvoiceStatusWebhookErrors
    )
)
