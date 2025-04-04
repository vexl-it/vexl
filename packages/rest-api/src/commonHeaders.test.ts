import {Schema} from 'effect'
import {CommonHeaders} from './commonHeaders'

describe('Common headers decoding', () => {
  it('Decodes common headers properly', () => {
    const valueToDecode = {
      'user-agent': 'Vexl/11 (1.12.1) ANDROID',
      'vexl-app-meta': JSON.stringify({
        'platform': 'ANDROID',
        'versionCode': 222,
        'semver': '1.1.1',
        'appSource': 'APK',
        'language': 'en',
        'isDeveloper': true,
      }),
    }

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('value', 'ANDROID')
    expect(decoded.clientVersionOrNone).toHaveProperty('value', 222)
    expect(decoded.clientSemverOrNone).toHaveProperty('value', '1.1.1')
    expect(decoded.appSourceOrNone).toHaveProperty('value', 'APK')
    expect(decoded.language).toHaveProperty('value', 'en')
    expect(decoded.isDeveloper).toBe(true)
  })

  it('Decodes as none when meta header not present at all', () => {
    const valueToDecode = {}

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientVersionOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientSemverOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.appSourceOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.language).toHaveProperty('_tag', 'None')
    expect(decoded.isDeveloper).toBe(false)
  })

  // it('Decodes as none when user agent in bad format', () => {
  //   const valueToDecode = {
  //     'vexl-app-meta': '{asdfasdfhhhcn',
  //   }

  //   const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

  //   expect(decoded.appSourceOrNone).toHaveProperty('_tag', 'None')
  //   expect(decoded.clientVersionOrNone).toHaveProperty('_tag', 'None')
  //   expect(decoded.clientSemverOrNone).toHaveProperty('_tag', 'None')
  //   expect(decoded.appSourceOrNone).toHaveProperty('_tag', 'None')
  //   expect(decoded.language).toHaveProperty('_tag', 'None')
  // })
})

describe('Common header encoding', () => {})

describe('Common headers decoding - old version', () => {
  it('Decodes common headers properly', () => {
    const valueToDecode: {readonly 'user-agent': string} = {
      'user-agent': 'Vexl/222 (1.1.1) ANDROID',
    }

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('value', 'ANDROID')
    expect(decoded.clientVersionOrNone).toHaveProperty('value', 222)
    expect(decoded.clientSemverOrNone).toHaveProperty('value', '1.1.1')
  })

  it('Decodes common headers properly when missing semver', () => {
    const valueToDecode = {'user-agent': 'Vexl/222 ANDROID'}

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('value', 'ANDROID')
    expect(decoded.clientVersionOrNone).toHaveProperty('value', 222)
    expect(decoded.clientSemverOrNone).toHaveProperty('_tag', 'None')
  })

  it('Decodes as none when user agent not present at all', () => {
    const valueToDecode = {}

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientVersionOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientSemverOrNone).toHaveProperty('_tag', 'None')
  })

  it('Decodes as none when user agent in bad format', () => {
    const valueToDecode = {
      'user-agent': 'Firefox/1.0',
    }

    const decoded = Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)

    expect(decoded.clientPlatformOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientVersionOrNone).toHaveProperty('_tag', 'None')
    expect(decoded.clientSemverOrNone).toHaveProperty('_tag', 'None')
  })
})
