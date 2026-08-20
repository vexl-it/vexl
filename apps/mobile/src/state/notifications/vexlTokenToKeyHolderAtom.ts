import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/index'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY} from '../../utils/mmkv/criticalMmkvKeys'

export const vexlTokenToKeyHolderAtom = atomWithParsedMmkvStorage(
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
  {data: {}},
  Schema.Struct({
    data: Schema.Record({
      key: VexlNotificationToken,
      value: PrivateKeyHolder,
    }),
  })
)

export const registerVexlTokenActionAtom = atom(
  null,
  (
    get,
    set,
    {
      vexlToken,
      keyHolder,
    }: {
      vexlToken: VexlNotificationToken
      keyHolder: PrivateKeyHolder
    }
  ): void => {
    set(vexlTokenToKeyHolderAtom, (prev) => ({
      data: {...prev.data, [vexlToken]: keyHolder},
    }))
  }
)

export const getKeyHolderForVexlTokenActionAtom = atom(
  null,
  (
    get,
    set,
    vexlToken: VexlNotificationToken
  ): PrivateKeyHolder | undefined => {
    return get(vexlTokenToKeyHolderAtom).data[vexlToken]
  }
)
