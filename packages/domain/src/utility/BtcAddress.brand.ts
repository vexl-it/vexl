import {z} from 'zod'

export const BtcAddress = z
  .string()
  .regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/)
  .brand<'BtcAddress'>()
export type BtcAddress = z.TypeOf<typeof BtcAddress>
