import {z} from 'zod'
import {randomUUID} from 'node:crypto'

export const Uuid = z.string().uuid().brand<'Uuid'>()
export type Uuid = z.TypeOf<typeof Uuid>

export function generateUuid(): Uuid {
  return Uuid.parse(randomUUID())
}
