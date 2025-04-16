import {type ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {leaveClubActionAtom} from '../../../state/clubs/atom/leaveClubActionAtom'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'

export const leaveClubWithAreYouSureActionAtom = atom(
  null,
  (get, set, club: ClubInfo) => {
    const {t} = get(translationAtom)
    return pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithText',
            title: t('clubs.areYouSureYouWantToLeave'),
            description: t('clubs.leavingWarning'),
            negativeButtonText: t('common.cancel'),
            positiveButtonText: t('common.yesLeave'),
          },
        ],
        variant: 'danger',
      }),
      Effect.zipRight(set(leaveClubActionAtom, club.uuid))
    )
  }
)
