import {aesGCMDecrypt, aesGCMEncrypt} from './aes'
import * as crypto from 'node:crypto'

describe('aes gcm', () => {
  const password = 'testPass'

  it('Should successfully encrypt and decrypt', () => {
    const data = 'Some data'
    const encrypted = aesGCMEncrypt({
      data,
      password,
    })
    const decrypted = aesGCMDecrypt({data: encrypted, password})
    expect(decrypted).toEqual(data)
  })

  it('Should decrypt static message', () => {
    const data = 'Some message that is really secret'
    const encrypted =
      '000.4KloZOAJ5r39EXD/s9wlnJTAiT4JJx208G479U8nVZ2wdw==.1UnVyWaQtUYA4foWM92PdQ=='
    const staticPass = 'some pass that is even more secret than message'
    const decrypted = aesGCMDecrypt({data: encrypted, password: staticPass})
    expect(decrypted).toEqual(data)
  })

  it('Should output data as expected', () => {
    const data = 'Another some messag'
    const staticPass = 'This is something'
    const encrypt = aesGCMEncrypt({data, password: staticPass})

    expect(encrypt).toEqual(
      '000.AEW+Xc++na8J9NdjRYP4lSA7Tg==.CDQUB6lB7S9XWKirY5DbVg=='
    )
  })

  it('Should fail when decrypting with bad security tag', () => {
    const data = 'some data'
    const encrypted = aesGCMEncrypt({data, password})
    const [version, payload] = encrypted.split('.')
    expect(() => {
      aesGCMDecrypt({
        data: `${version}.${payload}.${crypto
          .randomBytes(16)
          .toString('base64')}`,
        password,
      })
    }).toThrow('Unsupported state or unable to authenticate data')
  })

  it('Should fail when decrypting with bad password', () => {
    const data = 'some data'
    const encrypted = aesGCMEncrypt({data, password})
    expect(() => {
      aesGCMDecrypt({data: encrypted, password: 'bad password'})
    }).toThrow('Unsupported state or unable to authenticate data')
  })
})

describe('aes ctr', () => {
  // todo
})

describe('aes gcm ignore tag', () => {
  // todo
})
