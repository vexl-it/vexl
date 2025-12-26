import {Schema} from 'effect'

const btcAddressRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/

export const BtcAddress = Schema.String.pipe(
  Schema.filter(btcAddressRegex.test),
  Schema.brand('BtcAddress')
)
export type BtcAddress = typeof BtcAddress.Type
