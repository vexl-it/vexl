import {Brand, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'

export const Uuid = z
  .string()
  .uuid()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'Uuid'>>()(v))

export const UuidE = Schema.UUID.pipe(Schema.brand('Uuid'))

export type Uuid = Schema.Schema.Type<typeof UuidE>

export function generateUuid(): Uuid {
  return Uuid.parse(randomUUID())
}
