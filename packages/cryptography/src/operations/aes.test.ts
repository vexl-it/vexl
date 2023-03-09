import {
  aesGCMDecrypt,
  aesGCMEncrypt,
  aesGCMIgnoreTagDecrypt,
  aesGCMIgnoreTagEncrypt,
} from './aes'
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
  it('Decrypts message as expected', () => {
    const data =
      'Fp4QZLFdPLDl/pQ2xMOYyimH2IrRwbYa8NScPpwBpOXNp2PApmdcSnd22AymWOwoljucLnsXXfMJYFMOSZ0t6Cw9a3Qhy8/w/B+6rgcp/y7J5mERey6WzMQuT/VVNkwwhVJj2ColcFqF/GeFBJ5FpLEp7oW41pMZOGmP/C4AcmHDSHch93IaZA9tVE5/wEIQhuKEpruJqu5Z78w3QRwSLRCeGJtXvqbz5LFGymg/8kIFxACkTHwWOxPXg9C/bdQLA/zcz0GcUdsMdcSdT9dLi02H5awwBG/HaUAj8LgoFSiDfxyvCh8EQDEbDdgURG7c1c+BqpwlmxpDCDaMhwPE7q8Ymf/+h9kmBpLfOKmAHOlENnEupqBBNTirKqOspFzzkIKRW4BZTggIHj7JG0hGGBYMTH4xl16wi9l9KUo5WK/EbRxrjqbEQEmQ/ohJml2ia7JEl+qQSoVhA+Mtif1UQ/gMBQrIJ+yZoT7oQuBFaTcyShpT6mlJsmd/G1ahE+dJ2+fyS2pcQeHvKoyaRzf9gGYEVu2zsf1s/+WukwhyG2NIOFuw8S/LNIPrLCwlyGAi6f3ofnryfX67qpwrK1mO0mKIPNnv0bs5c6wzbOV7TNX2AASZx2cCb9KGuU78N8jO9QowGkXVlYXa/bdGUkmb/WbYqpc4D9TNXMqq+0pawAIAJFAu20inejFwzoydQQNO0qZvVtlvRUSGsbv//9oriJhkYPEoxcgwnDuMcIi3Z77Epo4dfued3zGXQJwelB39r2pSLF97EiQKah5QJdijN5XcT7SzqzrUtHQu2D78Ra4GEKDN6F5lawiF2LU8ndsK+ajW19Y5sIbrqEZzhd3KbH5x1RBnvQgWcWXYgl3ZBgXVpC8yhQC8Ett2nsyQRffKf86FoIz/9ADiaoziYjzB53IoIXc0FFwZWVrDHfqpa0FdBXJYLIa9yF6pzCz5+8EO6MAZDDUMKIj+blq2HLsC4F9x23ddRDNXxLK6QsZ3jYkolQ6gZcudTX72KncEd51W'
    const password =
      'Zx9c3CJDu9iWumBeBuZ1JIRw0VR0kc/3ewLEvfCtfGnzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6IjVbI0yZ4K6qNY/3MSU4aGsF4uiX7/6hYynoDx2zlB9rcA1gmj3kG+aeBtGEmRh6StRKcTpjcbAG1nCT4vEK25o83SUVOo1ufHClB9NK/0VKu49vU82MmsRJFPoVuCayWYGGsei/1FRCACAIipib9Yo0KkVKB9E2nHh5MCqyebvI5PzlgG2WBjImuGdQus1f+1mTR5OoDd/BckRD48HQJ7oE2SMktU63A5jr6muEQ=='

    const decrypted = aesGCMIgnoreTagDecrypt({data, password})
    expect(decrypted).toEqual(
      `{"offerPublicKey":"LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVNQTFJWWdxUEdpYWtpN21kaXdJU1A2K1BpeWlUY0tqdApzRVI0R1dxeXNCWmcxL3gvUHJrU1ZEMHRDN0Q2MEw0eDRtSXlLUHVySVpVPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K","location":["{\\"longitude\\":\\"14.4341412988000001860200427472591400146484375\\",\\"latitude\\":\\"50.08354938570000314257413265295326709747314453125\\",\\"city\\":\\"Praha\\"}"],"offerDescription":"Test","amountBottomLimit":"0.0","amountTopLimit":"250000.0","feeState":"WITHOUT_FEE","feeAmount":"1.0","locationState":"ONLINE","paymentMethod":["CASH"],"btcNetwork":["LIGHTING"],"currency":"CZK","offerType":"SELL","activePriceState":"NONE","activePriceValue":"0","activePriceCurrency":"CZK","active":"true","groupUuids":[]}`
    )
  })

  it('Encrypt message as expected', () => {
    const data = `{"offerPublicKey":"LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVNQTFJWWdxUEdpYWtpN21kaXdJU1A2K1BpeWlUY0tqdApzRVI0R1dxeXNCWmcxL3gvUHJrU1ZEMHRDN0Q2MEw0eDRtSXlLUHVySVpVPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K","location":["{\\"longitude\\":\\"14.4341412988000001860200427472591400146484375\\",\\"latitude\\":\\"50.08354938570000314257413265295326709747314453125\\",\\"city\\":\\"Praha\\"}"],"offerDescription":"Test","amountBottomLimit":"0.0","amountTopLimit":"250000.0","feeState":"WITHOUT_FEE","feeAmount":"1.0","locationState":"ONLINE","paymentMethod":["CASH"],"btcNetwork":["LIGHTING"],"currency":"CZK","offerType":"SELL","activePriceState":"NONE","activePriceValue":"0","activePriceCurrency":"CZK","active":"true","groupUuids":[]}`
    const password =
      'Zx9c3CJDu9iWumBeBuZ1JIRw0VR0kc/3ewLEvfCtfGnzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6IjVbI0yZ4K6qNY/3MSU4aGsF4uiX7/6hYynoDx2zlB9rcA1gmj3kG+aeBtGEmRh6StRKcTpjcbAG1nCT4vEK25o83SUVOo1ufHClB9NK/0VKu49vU82MmsRJFPoVuCayWYGGsei/1FRCACAIipib9Yo0KkVKB9E2nHh5MCqyebvI5PzlgG2WBjImuGdQus1f+1mTR5OoDd/BckRD48HQJ7oE2SMktU63A5jr6muEQ=='
    const encrypted = aesGCMIgnoreTagEncrypt({data, password})
    expect(encrypted).toEqual(
      'Fp4QZLFdPLDl/pQ2xMOYyimH2IrRwbYa8NScPpwBpOXNp2PApmdcSnd22AymWOwoljucLnsXXfMJYFMOSZ0t6Cw9a3Qhy8/w/B+6rgcp/y7J5mERey6WzMQuT/VVNkwwhVJj2ColcFqF/GeFBJ5FpLEp7oW41pMZOGmP/C4AcmHDSHch93IaZA9tVE5/wEIQhuKEpruJqu5Z78w3QRwSLRCeGJtXvqbz5LFGymg/8kIFxACkTHwWOxPXg9C/bdQLA/zcz0GcUdsMdcSdT9dLi02H5awwBG/HaUAj8LgoFSiDfxyvCh8EQDEbDdgURG7c1c+BqpwlmxpDCDaMhwPE7q8Ymf/+h9kmBpLfOKmAHOlENnEupqBBNTirKqOspFzzkIKRW4BZTggIHj7JG0hGGBYMTH4xl16wi9l9KUo5WK/EbRxrjqbEQEmQ/ohJml2ia7JEl+qQSoVhA+Mtif1UQ/gMBQrIJ+yZoT7oQuBFaTcyShpT6mlJsmd/G1ahE+dJ2+fyS2pcQeHvKoyaRzf9gGYEVu2zsf1s/+WukwhyG2NIOFuw8S/LNIPrLCwlyGAi6f3ofnryfX67qpwrK1mO0mKIPNnv0bs5c6wzbOV7TNX2AASZx2cCb9KGuU78N8jO9QowGkXVlYXa/bdGUkmb/WbYqpc4D9TNXMqq+0pawAIAJFAu20inejFwzoydQQNO0qZvVtlvRUSGsbv//9oriJhkYPEoxcgwnDuMcIi3Z77Epo4dfued3zGXQJwelB39r2pSLF97EiQKah5QJdijN5XcT7SzqzrUtHQu2D78Ra4GEKDN6F5lawiF2LU8ndsK+ajW19Y5sIbrqEZzhd3KbH5x1RBnvQgWcWXYgl3ZBgXVpC8yhQC8Ett2nsyQRffKf86FoIz/9ADiaoziYjzB53IoIXc0FFwZWVrDHfqpa0FdBXJYLIa9yF6pzCz5+8EO6MAZDDUMKIj+blq2HLsC4F9x23ddRDNXxLK6QsZ3'
    )
  })

  it('Encrypts and decrypts message', () => {
    const message =
      'jaskl fjasklj fklajs kldfjaskl dfjkla jsdfklaj skdfja sklfjklasjldfk jaslkdfjkla jdfklaj sdklfjakl sdjfklas jfklasj dkflaj sdlkfj aklsdjf aklsdjf kalsjdfk lasdf nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6'
    const password =
      'jkals fjkla sdfj laskjdf lkajskdlf nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6nzvgtEDOD+GQ4KIOwmf4NkHGNUc+H1XcJu5w3khJCj01zHF71/raVmx9zyV96e8saL6'

    const encrypted = aesGCMIgnoreTagEncrypt({data: message, password})
    const decrypted = aesGCMIgnoreTagDecrypt({data: encrypted, password})

    expect(decrypted).toEqual(message)
  })
})
