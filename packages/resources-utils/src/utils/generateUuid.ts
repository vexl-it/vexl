import {
  generateUuid as generateUuidFromDomain,
  type Uuid,
} from '@vexl-next/domain/src/utility/Uuid.brand'

/**
 * @deprecated Use {@link generateUuidFromDomain} instead
 */
export default function generateUuid(): Uuid {
  return generateUuidFromDomain()
}
