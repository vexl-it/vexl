import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {ecnryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import type * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import {type Option} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {platform, versionCode} from '../../utils/environment'
import {i18nAtom} from '../../utils/localization/I18nProvider'
import {registerNotificationCypherActionAtom} from './fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtom} from './fcmServerPublicKeyStore'

const addNotificationCypherToPublicPayloadActionAtom = atom(
  null,
  (
    get,
    set,
    {
      publicPart,
      notificationToken: notificationTokenOption,
      keyHolder,
    }: {
      publicPart: OfferPublicPart
      notificationToken: Option<ExpoNotificationToken>
      keyHolder: PrivateKeyHolder
    }
  ): T.Task<{publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean}> => {
    return pipe(
      set(getOrFetchNotificationServerPublicKeyActionAtom),
      TO.bindTo('notificationServerPublicKey'),
      TO.bind('notificationToken', () =>
        TO.fromOption(notificationTokenOption)
      ),
      TO.chain(({notificationServerPublicKey, notificationToken}) => {
        return TO.fromTaskEither(
          effectToTaskEither(
            ecnryptNotificationToken({
              clientPlatform: platform,
              clientVersion: versionCode,
              locale: get(i18nAtom).t('localeName'),
              notificationToken,
              serverPublicKey: notificationServerPublicKey,
            })
          )
        )
      }),
      TO.match(
        (): {publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean} => ({
          tokenSuccessfullyAdded: false,
          publicPart,
        }),
        (
          notificationToken
        ): {publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean} => {
          set(registerNotificationCypherActionAtom, {
            notificationCypher: notificationToken,
            keyHolder,
          })

          return {
            tokenSuccessfullyAdded: true,
            publicPart: {
              ...publicPart,
              fcmCypher: notificationToken,
            } satisfies OfferPublicPart,
          }
        }
      )
    )
  }
)

export default addNotificationCypherToPublicPayloadActionAtom
