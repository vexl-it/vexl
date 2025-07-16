import {type BinaryLike} from 'node:crypto'
import {getCrypto} from '../getCrypto'

export default async function pbkdf2(
  password: BinaryLike,
  salt: BinaryLike,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
  const crypto = getCrypto()

  return await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, key) => {
      if (err != null) {
        reject(err)
        return
      }
      resolve(key)
    })
  })
}
