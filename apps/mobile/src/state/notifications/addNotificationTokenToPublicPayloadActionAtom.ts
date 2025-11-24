import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {ecnryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {platform, versionCode} from '../../utils/environment'
import {i18nAtom} from '../../utils/localization/I18nProvider'
import {registerNotificationCypherActionAtom} from './fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtomE} from './fcmServerPublicKeyStore'

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
      notificationToken: Option.Option<ExpoNotificationToken>
      keyHolder: PrivateKeyHolder
    }
  ): Effect.Effect<{
    publicPart: OfferPublicPart
    tokenSuccessfullyAdded: boolean
  }> => {
    return Effect.gen(function* (_) {
      const notificationInfoO = Option.all({
        notificationServerPublicKey: yield* _(
          set(getOrFetchNotificationServerPublicKeyActionAtomE)
        ),
        notificationToken: notificationTokenOption,
      })

      if (Option.isNone(notificationInfoO)) {
        return {
          tokenSuccessfullyAdded: false,
          publicPart,
        }
      }

      const {notificationServerPublicKey, notificationToken} =
        notificationInfoO.value

      const encryptedTokenO = yield* _(
        ecnryptNotificationToken({
          clientPlatform: platform,
          clientVersion: versionCode,
          locale: get(i18nAtom).t('localeName'),
          notificationToken,
          serverPublicKey: notificationServerPublicKey,
        }),
        Effect.match({
          onFailure: () => Option.none(),
          onSuccess: (token) => Option.some(token),
        })
      )

      if (Option.isNone(encryptedTokenO)) {
        return {
          tokenSuccessfullyAdded: false,
          publicPart,
        }
      }

      set(registerNotificationCypherActionAtom, {
        notificationCypher: encryptedTokenO.value,
        keyHolder,
      })

      return {
        tokenSuccessfullyAdded: true,
        publicPart: {
          ...publicPart,
          fcmCypher: encryptedTokenO.value,
        } satisfies OfferPublicPart,
      }
    })
  }
)

export default addNotificationCypherToPublicPayloadActionAtom
