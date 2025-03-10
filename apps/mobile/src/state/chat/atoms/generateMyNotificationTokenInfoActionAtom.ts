import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type MyNotificationTokenInfo} from '@vexl-next/domain/src/general/messaging'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {ecnryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TO from 'fp-ts/TaskOption'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {i18nAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {registerNotificationCypherActionAtom} from '../../notifications/fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtom} from '../../notifications/fcmServerPublicKeyStore'
import {type ChatWithMessages} from '../domain'

const generateMyNotificationTokenInfoActionAtom = atom(
  null,
  (
    get,
    set,
    token: ExpoNotificationToken | undefined,
    keyHolder: PrivateKeyHolder
  ): TO.TaskOption<MyNotificationTokenInfo> => {
    return pipe(
      token ? T.of(token) : getNotificationToken(),
      T.bindTo('notificationToken'),
      T.bind('serverPublicKey', () =>
        set(getOrFetchNotificationServerPublicKeyActionAtom)
      ),
      T.chain(({notificationToken, serverPublicKey}) => {
        if (!notificationToken || serverPublicKey._tag === 'None') {
          return TO.none
        }

        return pipe(
          effectToTaskEither(
            ecnryptNotificationToken({
              serverPublicKey: serverPublicKey.value,
              notificationToken,
              locale: get(i18nAtom).t('localeName'),
            })
          ),
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
            (notificationCypher) => {
              set(registerNotificationCypherActionAtom, {
                notificationCypher,
                keyHolder,
              })
              return TO.some({
                cypher: notificationCypher,
                token: notificationToken,
              } satisfies MyNotificationTokenInfo)
            }
          )
        )
      })
    )
  }
)

export default generateMyNotificationTokenInfoActionAtom

export function updateMyNotificationTokenInfoInChat(
  myNotificationTokenInfo?: MyNotificationTokenInfo
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    chat: {
      ...chat.chat,
      lastReportedFcmToken: myNotificationTokenInfo,
    },
  })
}
