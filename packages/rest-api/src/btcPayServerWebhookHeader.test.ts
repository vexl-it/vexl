import {Schema} from 'effect'
import {BtcPayServerWebhookHeader} from './btcPayServerWebhookHeader'

describe('Btc Pay server webhook header decoding', () => {
  it('Decodes btc pay server webhook header properly', () => {
    const valueToDecode = {
      'btcpay-sig':
        'sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }

    const decoded = Schema.decodeUnknownSync(BtcPayServerWebhookHeader)(
      valueToDecode
    )

    expect(decoded.btcPayWebhookSignatureOrNone).toHaveProperty(
      'value',
      'sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    )
  })

  it('Decodes as none when header is missing', () => {
    const valueToDecode = {}

    const decoded = Schema.decodeUnknownSync(BtcPayServerWebhookHeader)(
      valueToDecode
    )

    expect(decoded.btcPayWebhookSignatureOrNone).toHaveProperty('_tag', 'None')
  })
})
