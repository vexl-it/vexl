import {KeyFormat, PrivateKey} from '@vexl-next/cryptography'
import {z} from 'zod'

const SerializedPrivateKey = z.string().brand<'SerializedPrivateKey'>()
export type SerializedPrivateKey = z.TypeOf<typeof SerializedPrivateKey>
export function serializePrivateKey(
  privateKey: PrivateKey
): SerializedPrivateKey {
  return SerializedPrivateKey.parse(privateKey.exportPrivateKey(KeyFormat.RAW))
}

export function deserializePrivateKey(
  privateKey: SerializedPrivateKey
): PrivateKey {
  return PrivateKey.import({key: privateKey, type: KeyFormat.RAW})
}
