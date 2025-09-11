import {
  type PrivateKeyHolder,
  PrivateKeyHolderE,
} from '@vexl-next/cryptography/src/KeyHolder/index'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {Schema} from 'effect/index'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorageE} from '../../utils/atomUtils/atomWithParsedMmkvStorageE'

export const notificationCypherToKeyHolderAtom = atomWithParsedMmkvStorageE(
  'fcmCypherToKeyHolder',
  {data: {}},
  Schema.Struct({
    data: Schema.Record({
      key: NotificationCypherE,
      value: PrivateKeyHolderE,
    }),
  })
)

export const registerNotificationCypherActionAtom = atom(
  null,
  (
    get,
    set,
    {
      notificationCypher,
      keyHolder,
    }: {notificationCypher: NotificationCypher; keyHolder: PrivateKeyHolder}
  ): void => {
    set(notificationCypherToKeyHolderAtom, (prev) => ({
      data: {...prev.data, [notificationCypher]: keyHolder},
    }))
  }
)

export const getKeyHolderForNotificationCypherActionAtom = atom(
  null,
  (
    get,
    set,
    notificationCypher: NotificationCypher
  ): PrivateKeyHolder | undefined => {
    return get(notificationCypherToKeyHolderAtom).data[notificationCypher]
  }
)
