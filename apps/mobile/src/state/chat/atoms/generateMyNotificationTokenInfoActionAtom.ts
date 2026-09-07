import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type MyNotificationTokenInfo} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {ecnryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {platform, versionCode} from '../../../utils/environment'
import {i18nAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import {reportErrorE} from '../../../utils/reportError'
import {registerNotificationCypherActionAtom} from '../../notifications/fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtomE} from '../../notifications/fcmServerPublicKeyStore'
import {type ChatWithMessages} from '../domain'

export const generateMyNotificationTokenInfoActionAtom = atom(
  null,
  (
    get,
    set,
    tokenIfProvided: ExpoNotificationToken | undefined,
    keyHolder: PrivateKeyHolder
  ): Effect.Effect<Option.Option<MyNotificationTokenInfo>> =>
    Effect.gen(function* () {
      const {notificationToken, serverPublicKey} = yield* Effect.fromOption(
        Option.all({
          notificationToken: Option.fromNullishOr(
            tokenIfProvided ?? (yield* getNotificationTokenE())
          ),
          serverPublicKey: yield* set(
            getOrFetchNotificationServerPublicKeyActionAtomE
          ),
        })
      )

      const encryptedNotificationToken = yield* pipe(
        ecnryptNotificationToken({
          serverPublicKey,
          clientPlatform: platform,
          clientVersion: versionCode,
          notificationToken,
          locale: get(i18nAtom).t('localeName'),
        }),
        Effect.tapError((e) =>
          reportErrorE('warn', new Error('Error while encrypting fcmToken'), {
            e,
          })
        )
      )

      set(registerNotificationCypherActionAtom, {
        notificationCypher: encryptedNotificationToken,
        keyHolder,
      })
      return {
        cypher: encryptedNotificationToken,
        token: notificationToken,
      } satisfies MyNotificationTokenInfo
    }).pipe(Effect.option)
)

export function updateMyNotificationTokenInfoInChat(
  myNotificationTokenInfo?: VexlNotificationToken
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    chat: {
      ...chat.chat,
      lastReportedVexlToken: myNotificationTokenInfo,
    },
  })
}
