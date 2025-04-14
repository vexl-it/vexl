import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {Share} from 'react-native'
import {addKeyToWaitingForAdmissionActionAtom} from '../../../../../state/clubs/atom/clubsStore'
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
    const langCode = t('localeName')

    const link = createClubAdmitionRequestLink({
      langCode,
      notificationToken,
      publicKey: privateKey.publicKeyPemBase64,
    })
    set(addKeyToWaitingForAdmissionActionAtom, privateKey)

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
