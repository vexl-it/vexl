import crypto from 'node:crypto'
import {HMAC_ALGORITHM} from '../constants'

export function hmacSign({
  password,
  data,
}: {
  password: string
  data: string
}): string {
  return crypto
    .createHmac(HMAC_ALGORITHM, Buffer.from(password, 'base64'))
    .update(data)
    .digest('base64')
}

export function hmacVerify({
  password,
  data,
  signature,
}: {
  password: string
  data: string
  signature: string
}): boolean {
  return signature === hmacSign({password, data})
}
