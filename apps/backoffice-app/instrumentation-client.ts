import {Array} from 'effect'

const toHex = (bytes: Uint8Array): string =>
  Array.map(Array.fromIterable(bytes), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')

/** RFC 4122 version 4, from the same CSPRNG the native one uses. */
const randomUuid = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = toHex(bytes)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// Browsers omit crypto.randomUUID outside secure contexts, such as local dev
// opened from another device over plain HTTP. Production builds drop this.
if (
  process.env.NODE_ENV === 'development' &&
  typeof crypto.randomUUID !== 'function'
) {
  Object.defineProperty(crypto, 'randomUUID', {value: randomUuid})
}
