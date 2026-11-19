import {createHash, randomBytes, timingSafeEqual} from 'node:crypto'

export const generateToken = (): string => randomBytes(32).toString('base64url')

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('base64')

const sha256 = (value: string): Buffer =>
  createHash('sha256').update(value).digest()

// Comparing digests keeps the comparison constant-time for any input length.
export const timingSafeStringEqual = (left: string, right: string): boolean =>
  timingSafeEqual(sha256(left), sha256(right))
