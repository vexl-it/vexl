import {HttpApiBuilder} from '@effect/platform/index'
import {type BtcPayWebhookShaSignature} from '@vexl-next/rest-api/src/btcPayServerWebhookHeader'

import {
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  UpdateInvoiceStatusWebhookRequest,
  UpdateInvoiceWebhookError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import * as crypto from 'node:crypto'
import {btcPayServerWebhookSecretConfig} from '../../configs'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

function isBtcPayServerSignatureValid({
  btcPayServerWebhookSecret,
  btcPayWebhookSignature,
  body,
}: {
  btcPayServerWebhookSecret: string
  btcPayWebhookSignature: BtcPayWebhookShaSignature
  body: unknown
}): Effect.Effect<boolean, UnexpectedServerError> {
  return Effect.sync(() => {
    const checksum = Buffer.from(btcPayWebhookSignature)
    const expectedBtcPayServerSignature =
      `sha256=` +
      crypto
        .createHmac('sha256', btcPayServerWebhookSecret)
        .update(JSON.stringify(body, null, 2))
        .digest('hex')
    const digest = Buffer.from(expectedBtcPayServerSignature)

    return (
      checksum.length === digest.length &&
      crypto.timingSafeEqual(digest, checksum)
    )
  }).pipe(
    Effect.catchAllDefect(
      (e) =>
        new UnexpectedServerError({
          cause: e,
          message: 'Failed to check the signature in BTC Pay server header',
        })
    )
  )
}

export const updateInvoiceStateWebhook = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Donations',
  'updateInvoiceStateWebhook',
  ({headers, payload: body}) =>
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
            cause: new Error('Secret received from btc pay server is missing'),
          })
        )

      yield* _(
        isBtcPayServerSignatureValid({
          body,
          btcPayServerWebhookSecret,
          btcPayWebhookSignature: btcPayWebhookSignatureOrNone.value,
        }),
        Effect.filterOrFail(
          (valid): valid is true => valid,
          () =>
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
    }).pipe(Effect.withSpan('updateInvoiceStateWebhook'), makeEndpointEffect)
)
