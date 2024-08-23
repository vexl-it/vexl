import {Schema} from '@effect/schema'
import {CommonHeaders} from './commonHeaders'

describe('User agent', () => {
  it('Decodes common headers properly', () => {
    const valueToDecode: {readonly 'user-agent': string} = {
      'user-agent': 'Vexl/222 (1.1.1) ANDROID',
    }

    const decoded =
      Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)['user-agent']

    expect(decoded._tag).toBe('VexlAppUserAgentHeader')
    if (decoded._tag !== 'VexlAppUserAgentHeader') return // will not happen

    expect(decoded.platform).toBe('ANDROID')
    expect(decoded.versionCode).toBe(222)
    expect(decoded.semver).toHaveProperty('value', '1.1.1')
  })

  it('Decodes common headers properly when missing semver', () => {
    const valueToDecode = {'user-agent': 'Vexl/222 ANDROID'}

    const decoded =
      Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)['user-agent']

    expect(decoded._tag).toBe('VexlAppUserAgentHeader')
    if (decoded._tag !== 'VexlAppUserAgentHeader') return // will not happen

    expect(decoded.platform).toBe('ANDROID')
    expect(decoded.versionCode).toBe(222)
    expect(decoded.semver).toHaveProperty('_tag', 'None')
  })

  it('Decodes as none when user agent not present at all', () => {
    const valueToDecode = {}

    const decoded =
      Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)['user-agent']

    expect(decoded._tag).toBe('UnknownUserAgentHeader')
    if (decoded._tag !== 'UnknownUserAgentHeader') return // will not happen
    expect(decoded.userAgent._tag).toBe('None')
  })

  it('Decodes as none when user agent in bad format', () => {
    const valueToDecode = {
      'user-agent': 'Firefox/1.0',
    }

    const decoded =
      Schema.decodeUnknownSync(CommonHeaders)(valueToDecode)['user-agent']
    expect(decoded._tag).toBe('UnknownUserAgentHeader')
    if (decoded._tag !== 'UnknownUserAgentHeader') return // will not happen

    expect(decoded.userAgent).toHaveProperty('value', 'Firefox/1.0')
  })
})
