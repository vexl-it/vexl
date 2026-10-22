import {
  decryptWithPassword,
  encryptWithPassword,
  InvalidPasswordCypherError,
  WrongPasswordError,
} from './passwordEncryption'

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
})
