import {type MyFcmTokenInfo} from '@vexl-next/domain/src/general/messaging'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {encryptFcmForOffer} from '@vexl-next/resources-utils/src/notifications/encryptFcmForOffer'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TO from 'fp-ts/TaskOption'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {getOrFetchNotificationServerPublicKeyActionAtom} from '../../notifications/fcmServerPublicKeyStore'
import {type ChatWithMessages} from '../domain'

const generateMyFcmTokenInfoActionAtom = atom(
  null,
  (get, set, fcmToken?: FcmToken): TO.TaskOption<MyFcmTokenInfo> => {
    return pipe(
      fcmToken ? T.of(fcmToken) : getNotificationToken(),
      T.bindTo('notificationToken'),
      T.bind('serverPublicKey', () =>
        set(getOrFetchNotificationServerPublicKeyActionAtom)
      ),
      T.chain(({notificationToken, serverPublicKey}) => {
        if (!notificationToken || serverPublicKey._tag === 'None') {
          return TO.none
        }

        return pipe(
          encryptFcmForOffer({
            publicKey: serverPublicKey.value,
            fcmToken: notificationToken,
          }),
          TE.matchE(
            (l) => {
              reportError(
                'warn',
                new Error('Error while encrypting fcmToken'),
                {
                  l,
                }
              )
              return TO.none
            },
            (fcmCypher) =>
              TO.some({
                cypher: fcmCypher,
                token: notificationToken,
              } satisfies MyFcmTokenInfo)
          )
        )
      })
    )
  }
)

export default generateMyFcmTokenInfoActionAtom

export function updateMyFcmTokenInfoInChat(
  myFcmTokenInfo?: MyFcmTokenInfo
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    chat: {
      ...chat.chat,
      lastReportedFcmToken: myFcmTokenInfo,
    },
  })
}
