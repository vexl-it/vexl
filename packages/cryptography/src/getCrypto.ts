import crypto from 'node:crypto'

export function getCrypto(): typeof crypto {
  return crypto
}
