import {getCrypto} from '../getCrypto'

export function sha256(data: string): string {
  return hash({data, algorithm: 'sha256'})
}

export function sha1(data: string): string {
  return hash({data, algorithm: 'sha1'})
}

function hash({data, algorithm}: {data: string; algorithm: string}): string {
  const crypto = getCrypto()
  return crypto.createHash(algorithm).update(data).digest('base64')
}
