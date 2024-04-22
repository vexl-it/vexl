import * as S from '@effect/schema/Schema'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Brand} from 'effect'
import {z} from 'zod'

export const FcmCypher = z
  .string()
  .includes('.')
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'FcmCypher'>>()(v))

export const FcmCypherE = S.String.pipe(S.brand('FcmCypher'))
export type FcmCypher = S.Schema.Type<typeof FcmCypherE>

export function extractPublicKeyFromCypher(
  fcmCypher: FcmCypher | undefined
): PublicKeyPemBase64 | undefined {
  if (fcmCypher === undefined) return undefined
  const split = fcmCypher?.split('.')?.at(0)
  if (!split) return undefined

  return S.decodeSync(PublicKeyPemBase64E)(split)
}

export function extractCypherFromFcmCypher(
  fcmCypher: FcmCypher | undefined
): string | undefined {
  if (fcmCypher === undefined) return undefined
  const split = fcmCypher?.split('.')?.at(1)
  if (!split) return undefined

  return split
}
