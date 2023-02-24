import {KeyFormat, PrivateKey} from '@vexl-next/cryptography'
import * as E from 'fp-ts/Either'
import {z} from 'zod'

const SerializedPrivateKey = z.string().brand<'SerializedPrivateKey'>()
export type SerializedPrivateKey = z.TypeOf<typeof SerializedPrivateKey>
export function serializePrivateKey(
  privateKey: PrivateKey
): SerializedPrivateKey {
  return SerializedPrivateKey.parse(privateKey.exportPrivateKey(KeyFormat.RAW))
}

export interface PrivateKeyDeserializationError {
  _tag: 'PrivateKeyDeserializationError'
  error: unknown
}
export function deserializePrivateKey(
  privateKey: SerializedPrivateKey
): E.Either<PrivateKeyDeserializationError, PrivateKey> {
  return E.tryCatch(
    () => PrivateKey.import({key: privateKey, type: KeyFormat.RAW}),
    (e) => ({_tag: 'PrivateKeyDeserializationError', error: e})
  )
}
