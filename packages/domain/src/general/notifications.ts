import {z} from 'zod'

// In format: 'publicKey.cypher'
export const FcmCypher = z.string().brand<'FcmCypher'>()
export type FcmCypher = z.TypeOf<typeof FcmCypher>

export function extractPublicKeyFromCypher(
  fcmCypher: FcmCypher | undefined
): string | undefined {
  return fcmCypher?.split('.')?.at(0)
}
