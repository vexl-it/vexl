import {
  FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
  isCriticalMmkvKey,
  STORED_CLUBS_V2_MMKV_KEY,
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
} from './criticalMmkvKeys'

describe('criticalMmkvKeys', () => {
  it.each([
    [STORED_CLUBS_V2_MMKV_KEY, 'storedClubsV2'],
    [FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY, 'fcmCypherToKeyHolder'],
    [VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY, 'vexlTokenToKeyHolder'],
  ])('recognizes %s as critical', (key, persistedKey) => {
    expect(key).toBe(persistedKey)
    expect(isCriticalMmkvKey(key)).toBe(true)
  })
})
