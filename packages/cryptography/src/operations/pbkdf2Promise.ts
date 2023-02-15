import crypto from 'node:crypto'

export default async function pbkdf2(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
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
