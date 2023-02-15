import * as crypto from 'node:crypto'

export function sha256(data: string): string {
  return hash({data, algorithm: 'sha256'})
}

export function sha1(data: string): string {
  return hash({data, algorithm: 'sha1'})
}

function hash({data, algorithm}: {data: string; algorithm: string}): string {
  return crypto.createHash(algorithm).update(data).digest('base64')
}
