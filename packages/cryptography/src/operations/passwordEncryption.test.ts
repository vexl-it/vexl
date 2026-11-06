import crypto from 'node:crypto'
import {
  decryptWithPassword,
  encryptWithPassword,
  InvalidPasswordCypherError,
  WrongPasswordError,
} from './passwordEncryption'
import pbkdf2 from './pbkdf2Promise'

describe('password encryption', () => {
  const password = '123456'

  it('Should encrypt and decrypt', async () => {
    const data = 'Some data with ünicode 🙂'
    const encrypted = await encryptWithPassword({data, password})
    expect(encrypted).not.toContain(data)
    expect(await decryptWithPassword({data: encrypted, password})).toEqual(data)
  })

  it('Should use random salt and iv', async () => {
    const data = 'Some data'
    expect(await encryptWithPassword({data, password})).not.toEqual(
      await encryptWithPassword({data, password})
    )
  })

  it('Should handle multi-megabyte payloads', async () => {
    const data = 'a'.repeat(8_000_000)
    const encrypted = await encryptWithPassword({data, password})
    expect(await decryptWithPassword({data: encrypted, password})).toEqual(data)
  })

  it('Should fail with WrongPasswordError for a wrong password', async () => {
    const encrypted = await encryptWithPassword({data: 'data', password})
    await expect(
      decryptWithPassword({data: encrypted, password: '654321'})
    ).rejects.toBeInstanceOf(WrongPasswordError)
  })

  it('Should fail with InvalidPasswordCypherError for a malformed cypher', async () => {
    await expect(
      decryptWithPassword({data: 'c2hvcnQ=', password})
    ).rejects.toBeInstanceOf(InvalidPasswordCypherError)
  })

  it('Should decrypt a cypher written with the node crypto AES-GCM layout', async () => {
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(12)
    const key = await pbkdf2(password, salt, 600_000, 32, 'sha256')
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([
      cipher.update('data', 'utf8'),
      cipher.final(),
    ])
    const cypher = Buffer.concat([
      salt,
      iv,
      cipher.getAuthTag(),
      encrypted,
    ]).toString('base64')

    expect(await decryptWithPassword({data: cypher, password})).toEqual('data')
  })

  it('Should fail with WrongPasswordError for a tampered auth tag', async () => {
    const bytes = Buffer.from(
      await encryptWithPassword({data: 'data', password}),
      'base64'
    )
    bytes[16 + 12] = (bytes[16 + 12] ?? 0) ^ 1

    await expect(
      decryptWithPassword({data: bytes.toString('base64'), password})
    ).rejects.toBeInstanceOf(WrongPasswordError)
  })
})
