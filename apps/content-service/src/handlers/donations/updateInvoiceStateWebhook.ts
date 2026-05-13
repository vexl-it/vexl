import type {HttpServerRequest} from '@effect/platform/index'
import type {
  BtcPayServerWebhookHeader,
  BtcPayWebhookShaSignature,
} from '@vexl-next/rest-api/src/btcPayServerWebhookHeader'

import type {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  UpdateInvoiceStatusWebhookRequest,
  UpdateInvoiceWebhookError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import * as crypto from 'node:crypto'
import {btcPayServerWebhookSecretConfig} from '../../configs'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

function isBtcPayServerSignatureValid({
  btcPayServerWebhookSecret,
  btcPayWebhookSignature,
  rawBody,
}: {
  btcPayServerWebhookSecret: string
  btcPayWebhookSignature: BtcPayWebhookShaSignature
  rawBody: string
}): Effect.Effect<boolean, UnexpectedServerError> {
  return Effect.sync(() => {
    const checksum = Buffer.from(btcPayWebhookSignature)
    const expectedBtcPayServerSignature =
      `sha256=` +
      crypto
        .createHmac('sha256', btcPayServerWebhookSecret)
        .update(rawBody)
        .digest('hex')
    const digest = Buffer.from(expectedBtcPayServerSignature)

    return (
      checksum.length === digest.length &&
      crypto.timingSafeEqual(digest, checksum)
    )
  }).pipe(
    Effect.catchAllDefect((e) =>
      Effect.fail(
        new UnexpectedServerError({
          cause: e,
          message: 'Failed to check the signature in BTC Pay server header',
        })
      )
    )
  )
}

export const updateInvoiceStateWebhook = ({
  headers,
  request,
}: {
  headers: BtcPayServerWebhookHeader
  request: HttpServerRequest.HttpServerRequest
}): Effect.Effect<
  {},
  | NotFoundError
  | UnauthorizedError
  | UpdateInvoiceWebhookError
  | UnexpectedServerError,
  UpdateInvoiceStateWebhookService
> =>
  Effect.gen(function* (_) {
    const rawBody = yield* _(
      request.text,
      Effect.mapError(
        (e) =>
          new UpdateInvoiceWebhookError({
            cause: e,
            status: 400,
            message: 'Invalid webhook body error',
          })
      )
    )
    const body: unknown = yield* _(
      Effect.try({
        try: () => JSON.parse(rawBody),
        catch: (e) =>
          new UpdateInvoiceWebhookError({
            cause: e,
            status: 400,
            message: 'Invalid webhook JSON error',
          }),
      })
    )

    const updateInvoiceStateWebhookService = yield* _(
      UpdateInvoiceStateWebhookService
    )
    const btcPayServerWebhookSecret = yield* _(btcPayServerWebhookSecretConfig)

    const {btcPayWebhookSignatureOrNone} = headers

    if (Option.isNone(btcPayWebhookSignatureOrNone)) {
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            status: 401,
            message: 'Secret received from btc pay server is missing',
            cause: new Error('Secret received from btc pay server is missing'),
          })
        )
      )
    }

    const signatureValid = yield* _(
      isBtcPayServerSignatureValid({
        rawBody,
        btcPayServerWebhookSecret,
        btcPayWebhookSignature: btcPayWebhookSignatureOrNone.value,
      })
    )

    if (!signatureValid) {
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            status: 401,
            message: 'Invalid secret received from btc pay server',
            cause: new Error('Invalid secret received from btc pay server'),
          })
        )
      )
    }

    const webhookPayload = yield* _(
      Schema.decodeUnknown(UpdateInvoiceStatusWebhookRequest)(body).pipe(
        Effect.mapError(
          (e) =>
            new UpdateInvoiceWebhookError({
              cause: e,
              status: 400,
              message: 'Invalid webhook payload error',
            })
        )
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
