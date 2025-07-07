import {Option, Schema} from 'effect'

export const BtcPayWebhookShaSignature = Schema.String.pipe(
  Schema.brand('BtcPayWebhookShaSignature')
)
export type BtcPayWebhookShaSignature = typeof BtcPayWebhookShaSignature.Type

export class BtcPayServerWebhookHeader extends Schema.Class<BtcPayServerWebhookHeader>(
  'BtcPayServerWebhookHeader'
)({
  'btcpay-sig': Schema.optional(BtcPayWebhookShaSignature),
}) {
  get btcPayWebhookSignatureOrNone(): Option.Option<BtcPayWebhookShaSignature> {
    if (this['btcpay-sig']) {
      return Option.some(this['btcpay-sig'])
    }

    return Option.none()
  }
}
