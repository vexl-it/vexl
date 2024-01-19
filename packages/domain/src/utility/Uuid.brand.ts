import {randomUUID} from 'node:crypto'
import {z} from 'zod'

export const Uuid = z.string().uuid().brand<'Uuid'>()
export type Uuid = z.TypeOf<typeof Uuid>

export function generateUuid(): Uuid {
  return Uuid.parse(randomUUID())
}
