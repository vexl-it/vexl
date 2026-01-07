import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/index'
import {VexlNotificationTokenNotTemporary} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

export const vexlTokenToKeyHolderAtom = atomWithParsedMmkvStorage(
  'vexlTokenToKeyHolder',
  {data: {}},
  Schema.Struct({
    data: Schema.Record({
      key: VexlNotificationTokenNotTemporary,
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
      vexlToken: typeof VexlNotificationTokenNotTemporary.Type
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
    vexlToken: typeof VexlNotificationTokenNotTemporary.Type
  ): PrivateKeyHolder | undefined => {
    return get(vexlTokenToKeyHolderAtom).data[vexlToken]
  }
)
