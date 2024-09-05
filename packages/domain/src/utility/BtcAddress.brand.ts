import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {z} from 'zod'

const btcAddressRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/

export const BtcAddress = z
  .string()
  .regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/)
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'BtcAddress'>>()(v))
export const BtcAddressE = Schema.String.pipe(
  Schema.filter(btcAddressRegex.test),
  Schema.brand('BtcAddress')
)
export type BtcAddress = z.TypeOf<typeof BtcAddress>
