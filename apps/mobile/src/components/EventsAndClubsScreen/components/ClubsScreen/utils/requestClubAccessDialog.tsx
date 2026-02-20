import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {Share} from 'react-native'
import {addKeyToWaitingForAdmissionActionAtom} from '../../../../../state/clubs/atom/clubsToKeyHolderV2Atom'
import {generateVexlTokenActionAtom} from '../../../../../state/notifications/actions/generateVexlTokenActionAtom'
import {createClubAdmitionRequestLink} from '../../../../../utils/deepLinks/createLinks'
import {translationAtom} from '../../../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../../../utils/notifications'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import {QrCodeComponent} from '../../../../QrCodeComponent'

export const showClubAccessDialogActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return Effect.gen(function* (_) {
    const notificationToken = yield* _(
      getNotificationTokenE(),
      Effect.map(Option.fromNullable)
    )
    const privateKey = generatePrivateKey()
    const privateKeyV2 = yield* generateV2KeyPair()
    const langCode = t('localeName')

    const vexlNotificationToken = yield* _(set(generateVexlTokenActionAtom))

    const link = createClubAdmitionRequestLink({
      langCode,
      notificationToken,
      vexlNotificationToken: Option.some(vexlNotificationToken),
      publicKey: privateKey.publicKeyPemBase64,
      publicKeyV2: privateKeyV2.publicKey,
    })
    set(addKeyToWaitingForAdmissionActionAtom, {
      keyPair: privateKeyV2,
      oldKeyPair: privateKey,
    })

    return yield* _(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: QrCodeComponent,
            mainSectionComponentProps: {
              link,
              logo: require('../../../../images/app_logo.png'),
              heading: t('clubs.requestClubAccess'),
              text: t('clubs.requestClubAccessInfo'),
            },
            positiveButtonText: t('common.share'),
            negativeButtonText: t('common.close'),
          },
        ],
        variant: 'info',
      }),
      Effect.tap(() =>
        Effect.promise(async () => {
          await Share.share({message: link})
        })
      )
    )
  })
})
