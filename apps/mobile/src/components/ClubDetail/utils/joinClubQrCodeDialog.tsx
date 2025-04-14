import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {Share} from 'react-native'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {QrCodeComponent} from '../../QrCodeComponent'

export const showJoinClubQrCodeActionAtom = atom(
  null,
  (get, set, link: string, clubImage: UriString) => {
    const {t} = get(translationAtom)
    return set(askAreYouSureActionAtom, {
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: QrCodeComponent,
          mainSectionComponentProps: {
            heading: t('clubs.moderator.inviteQrCode.title'),
            text: t('clubs.moderator.inviteQrCode.text'),
            link,
            imageUri: {uri: clubImage},
          },
          positiveButtonText: t('common.share'),
          negativeButtonText: t('common.close'),
        },
      ],
      variant: 'info',
    }).pipe(
      Effect.tap(() =>
        Effect.promise(async () => {
          await Share.share({message: link})
        })
      )
    )
  }
)
