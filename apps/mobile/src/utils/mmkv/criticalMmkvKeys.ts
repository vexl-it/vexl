import {Array, Schema, pipe} from 'effect'
import {type MmkvStore} from './inMemoryMmkvStore'

export const STORED_CLUBS_V2_MMKV_KEY = 'storedClubsV2'
export const FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY = 'fcmCypherToKeyHolder'
export const VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY = 'vexlTokenToKeyHolder'

export const CriticalMmkvKeySchema = Schema.Literal(
  'messagingState',
  'offers',
  'storedContacts',
  'connectionsStateV2',
  'offer-to-connections',
  'postLoginFlowProgress1',
  STORED_CLUBS_V2_MMKV_KEY,
  FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY
)

export type CriticalMmkvKey = typeof CriticalMmkvKeySchema.Type

export const CRITICAL_MMKV_KEYS: readonly CriticalMmkvKey[] = [
  'messagingState',
  'offers',
  'storedContacts',
  'connectionsStateV2',
  'offer-to-connections',
  'postLoginFlowProgress1',
  STORED_CLUBS_V2_MMKV_KEY,
  FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
]

export const CRITICAL_KEYS_PRESENCE_RECORD_KEY = '__mmkv_critical_keys_present'

export const CriticalKeysPresenceRecordSchema = Schema.Struct({
  presentKeys: Schema.Array(CriticalMmkvKeySchema),
})

export type CriticalKeysPresenceRecord =
  typeof CriticalKeysPresenceRecordSchema.Type

export function isCriticalMmkvKey(key: string): key is CriticalMmkvKey {
  return pipe(CRITICAL_MMKV_KEYS, Array.contains(key))
}

export function getPresentCriticalMmkvKeys(
  mmkv: Pick<MmkvStore, 'getAllKeys'>
): CriticalMmkvKey[] {
  const allKeys = mmkv.getAllKeys()
  return pipe(
    CRITICAL_MMKV_KEYS,
    Array.filter((key) => Array.contains(allKeys, key))
  )
}
