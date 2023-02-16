import z from 'zod'
import {PrivateKey} from '@vexl-next/cryptography'

export const SessionCredentials = z
  .object({
    privateKey: z.custom<PrivateKey>((v) => v instanceof PrivateKey),
    hash: z.string(),
    signature: z.string(),
  })
  .brand<'SessionCredentials'>()

export type SessionCredentials = z.TypeOf<typeof SessionCredentials>
