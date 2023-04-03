import crypto from 'node:crypto'
import {Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
export default function generateUuid(): Uuid {
  return Uuid.parse(crypto.randomUUID())
}
