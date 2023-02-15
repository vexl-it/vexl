import crypto from 'node:crypto'
import {HMAC_ALGORITHM, PBKDF2ITER, SALT} from '../constants'

export function hmacSign({
  password,
  data,
}: {
  password: string
  data: string
}): string {
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, 'sha256')
    .subarray(44, 44 + 64)

  const result = crypto
    .createHmac(HMAC_ALGORITHM, stretched)
    .update(data)
    .digest('base64')
  return result
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
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, 'sha256')
    .subarray(44, 44 + 64)

  const hmac = crypto.createHmac(HMAC_ALGORITHM, stretched)
  const hash = hmac.update(data).digest('base64')
  return hash === signature
}
