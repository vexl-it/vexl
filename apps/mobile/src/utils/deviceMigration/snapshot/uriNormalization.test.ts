import {Either} from 'effect'
import {
  denormalizeUrisToDestination,
  normalizePersistedValueUris,
} from './uriNormalization'

describe('migration URI normalization', () => {
  it.each([
    'file:///var/mobile/Containers/Data/Application/ABC-123/Documents/chat-images/a/photo%201.jpg',
    'file:///data/user/0/it.vexl.next/files/chat-images/a/photo%201.jpg',
    'file:///data/data/it.vexl.next/files/chat-images/a/photo%201.jpg',
  ])('normalizes and relocates %s', (uri) => {
    const normalized = normalizePersistedValueUris(JSON.stringify({uri}), [])
    expect(Either.isRight(normalized)).toBe(true)
    if (Either.isLeft(normalized)) return
    expect(normalized.right).toContain(
      'vexl-migration-file://chat-images/a/photo 1.jpg'
    )
    const relocated = denormalizeUrisToDestination(
      normalized.right,
      'file:///destination/Documents/'
    )
    expect(Either.isRight(relocated)).toBe(true)
    if (Either.isRight(relocated))
      expect(relocated.right).toContain(
        'file:///destination/Documents/chat-images/a/photo%201.jpg'
      )
  })

  it('maps legacy root profile pictures into the canonical root', () => {
    const normalized = normalizePersistedValueUris(
      JSON.stringify({uri: 'file:///root/profilePictureabc.jpeg'}),
      ['file:///root/']
    )
    expect(Either.isRight(normalized)).toBe(true)
    if (Either.isRight(normalized))
      expect(normalized.right).toContain(
        'vexl-migration-file://profilePicture/profilePictureabc.jpeg'
      )
  })

  it('fails closed on unresolved file URIs', () => {
    const normalized = normalizePersistedValueUris(
      JSON.stringify({uri: 'file:///etc/passwd'}),
      []
    )
    expect(Either.isLeft(normalized)).toBe(true)
    if (Either.isLeft(normalized))
      expect(normalized.left.code).toBe('pathInvalid')
  })
})
