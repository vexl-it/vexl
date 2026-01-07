import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/index'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type NotificationTokenOrCypher} from '@vexl-next/resources-utils/src/notifications/callWithNotificationService'
import {Schema} from 'effect/index'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {vexlTokenToKeyHolderAtom} from './vexlTokenToKeyHolderAtom'

export const notificationCypherToKeyHolderAtom = atomWithParsedMmkvStorage(
  'fcmCypherToKeyHolder',
  {data: {}},
  Schema.Struct({
    data: Schema.Record({
      key: NotificationCypher,
      value: PrivateKeyHolder,
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

/**
 * Combined lookup that checks both vexl tokens and legacy notification cyphers.
 * Prefer using this when you have a NotificationTokenOrCypher that could be either type.
 */
export const getKeyHolderForNotificationTokenOrCypherActionAtom = atom(
  null,
  (
    get,
    set,
    token: NotificationTokenOrCypher | undefined
  ): PrivateKeyHolder | undefined => {
    if (!token) return undefined

    // First check if it's a vexl token
    if (isVexlNotificationToken(token)) {
      const vexlTokenData = get(vexlTokenToKeyHolderAtom)
      return vexlTokenData.data[token]
    }

    // Otherwise look up in legacy notification cyphers
    return get(notificationCypherToKeyHolderAtom).data[token]
  }
)
