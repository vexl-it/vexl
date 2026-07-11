import {Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {
  MAX_FILE_RELATIVE_PATH_UTF8_BYTES,
  MAX_MMKV_KEY_UTF8_BYTES,
} from './limits'
import {
  isValidNormalizedRelativeFilePath,
  MmkvEntry,
  MmkvEntryKey,
  NormalizedRelativeFilePath,
} from './snapshotEntries'

const decodePath = Schema.decodeUnknownEither(NormalizedRelativeFilePath)
const decodeKey = Schema.decodeUnknownEither(MmkvEntryKey)
const decodeEntry = Schema.decodeUnknownEither(MmkvEntry)

describe('NormalizedRelativeFilePath', () => {
  it('accepts ordinary chat image and profile picture paths', () => {
    expect(
      isValidNormalizedRelativeFilePath('chat-images/abc123/photo.jpg')
    ).toBe(true)
    expect(isValidNormalizedRelativeFilePath('profilePicture/me.png')).toBe(
      true
    )
    expect(Either.isRight(decodePath('chat-images/a/b.jpg'))).toBe(true)
  })

  it('accepts raw-base64 MD5 chat directory names including +, = and /', () => {
    // Per-chat directory names are raw base64 of md5(myPub + otherPub) and
    // may contain '+', '=' and '/'. A '/' creates one more nesting level.
    expect(
      isValidNormalizedRelativeFilePath(
        'chat-images/aGVsbG8rd29ybGQ9PQ==/photo.jpg'
      )
    ).toBe(true)
    expect(
      isValidNormalizedRelativeFilePath('chat-images/ab+c/deF=/photo.jpg')
    ).toBe(true)
  })

  it('accepts legacy-mapped profilePicture basenames', () => {
    expect(
      isValidNormalizedRelativeFilePath('profilePicture/profilePicture3f2c.jpg')
    ).toBe(true)
  })

  it('rejects absolute paths', () => {
    expect(isValidNormalizedRelativeFilePath('/chat-images/a/b.jpg')).toBe(
      false
    )
    expect(
      isValidNormalizedRelativeFilePath('/var/mobile/Documents/x.jpg')
    ).toBe(false)
  })

  it('rejects traversal and dot segments', () => {
    expect(isValidNormalizedRelativeFilePath('chat-images/../session')).toBe(
      false
    )
    expect(isValidNormalizedRelativeFilePath('../chat-images/a/b.jpg')).toBe(
      false
    )
    expect(isValidNormalizedRelativeFilePath('chat-images/./b.jpg')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('chat-images//b.jpg')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('chat-images/a/b.jpg/')).toBe(
      false
    )
  })

  it('rejects backslash separators', () => {
    expect(isValidNormalizedRelativeFilePath('chat-images\\a\\b.jpg')).toBe(
      false
    )
    expect(isValidNormalizedRelativeFilePath('chat-images/a\\b.jpg')).toBe(
      false
    )
  })

  it('rejects NUL and control characters', () => {
    expect(isValidNormalizedRelativeFilePath('chat-images/a/b\u0000.jpg')).toBe(
      false
    )
    expect(isValidNormalizedRelativeFilePath('chat-images/a/b\n.jpg')).toBe(
      false
    )
    expect(isValidNormalizedRelativeFilePath('chat-images/a/b\u007f.jpg')).toBe(
      false
    )
  })

  it('rejects roots outside the allowlist', () => {
    expect(isValidNormalizedRelativeFilePath('mmkv/mmkv.default')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('documents/a.jpg')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('chat-imagesx/a.jpg')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('chat-images')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('profilePicture')).toBe(false)
    expect(isValidNormalizedRelativeFilePath('')).toBe(false)
  })

  it('rejects nesting below profilePicture', () => {
    expect(isValidNormalizedRelativeFilePath('profilePicture/a/b.jpg')).toBe(
      false
    )
  })

  it('enforces the 512 UTF-8 byte limit at the boundary', () => {
    const prefix = 'chat-images/'
    const pathOfByteLength = (byteLength: number): string =>
      `${prefix}${'a'.repeat(byteLength - prefix.length)}`

    expect(
      isValidNormalizedRelativeFilePath(
        pathOfByteLength(MAX_FILE_RELATIVE_PATH_UTF8_BYTES - 1)
      )
    ).toBe(true)
    expect(
      isValidNormalizedRelativeFilePath(
        pathOfByteLength(MAX_FILE_RELATIVE_PATH_UTF8_BYTES)
      )
    ).toBe(true)
    expect(
      isValidNormalizedRelativeFilePath(
        pathOfByteLength(MAX_FILE_RELATIVE_PATH_UTF8_BYTES + 1)
      )
    ).toBe(false)
  })

  it('measures the limit in UTF-8 bytes, not UTF-16 code units', () => {
    // '€' is 1 UTF-16 code unit but 3 UTF-8 bytes
    const prefix = 'chat-images/'
    const overByBytes = `${prefix}${'€'.repeat(171)}` // 12 + 513 bytes
    expect(overByBytes.length).toBeLessThan(MAX_FILE_RELATIVE_PATH_UTF8_BYTES)
    expect(isValidNormalizedRelativeFilePath(overByBytes)).toBe(false)
  })
})

describe('MmkvEntryKey', () => {
  it('enforces the 256 UTF-8 byte limit at the boundary', () => {
    expect(
      Either.isRight(decodeKey('a'.repeat(MAX_MMKV_KEY_UTF8_BYTES - 1)))
    ).toBe(true)
    expect(Either.isRight(decodeKey('a'.repeat(MAX_MMKV_KEY_UTF8_BYTES)))).toBe(
      true
    )
    expect(
      Either.isLeft(decodeKey('a'.repeat(MAX_MMKV_KEY_UTF8_BYTES + 1)))
    ).toBe(true)
    expect(Either.isLeft(decodeKey(''))).toBe(true)
  })

  it('measures the limit in UTF-8 bytes', () => {
    expect(Either.isLeft(decodeKey('€'.repeat(86)))).toBe(true) // 258 bytes
    expect(Either.isRight(decodeKey('€'.repeat(85)))).toBe(true) // 255 bytes
  })
})

describe('MmkvEntry', () => {
  it('decodes every native type', () => {
    expect(
      Either.isRight(decodeEntry({type: 'string', key: 'a', value: 'hello'}))
    ).toBe(true)
    expect(
      Either.isRight(decodeEntry({type: 'boolean', key: 'a', value: true}))
    ).toBe(true)
    expect(
      Either.isRight(decodeEntry({type: 'number', key: 'a', value: 4.2}))
    ).toBe(true)
    expect(
      Either.isRight(
        decodeEntry({
          type: 'buffer',
          key: 'a',
          value: Base64.fromUint8Array(Uint8Array.of(1, 2, 3)),
          byteLength: 3,
        })
      )
    ).toBe(true)
  })

  it('rejects unknown native types and mismatched value types', () => {
    expect(
      Either.isLeft(decodeEntry({type: 'json', key: 'a', value: '{}'}))
    ).toBe(true)
    expect(
      Either.isLeft(decodeEntry({type: 'boolean', key: 'a', value: 'true'}))
    ).toBe(true)
    expect(
      Either.isLeft(decodeEntry({type: 'number', key: 'a', value: '42'}))
    ).toBe(true)
  })

  it('rejects buffers whose declared byteLength does not match', () => {
    expect(
      Either.isLeft(
        decodeEntry({
          type: 'buffer',
          key: 'a',
          value: Base64.fromUint8Array(Uint8Array.of(1, 2, 3)),
          byteLength: 4,
        })
      )
    ).toBe(true)
  })

  it('rejects buffers that are not valid base64', () => {
    expect(
      Either.isLeft(
        decodeEntry({type: 'buffer', key: 'a', value: '!!!', byteLength: 0})
      )
    ).toBe(true)
  })
})
