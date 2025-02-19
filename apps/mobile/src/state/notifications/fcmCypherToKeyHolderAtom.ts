import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/index'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {atom} from 'jotai'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

export const notificationCypherToKeyHolderAtom = atomWithParsedMmkvStorage(
  'fcmCypherToKeyHolder',
  {data: {}},
  z.object({data: z.record(NotificationCypher, PrivateKeyHolder)}).readonly()
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
