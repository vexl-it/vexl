import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {Schema} from 'effect'

export const Uuid = Schema.UUID.pipe(Schema.brand('Uuid'))

export type Uuid = typeof Uuid.Type

export function generateUuid(): Uuid {
  return Schema.decodeSync(Uuid)(getCrypto().randomUUID())
}
