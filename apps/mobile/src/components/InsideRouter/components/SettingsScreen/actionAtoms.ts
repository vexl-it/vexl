import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect/index'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {Linking} from 'react-native'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {currentAppLanguageAtom} from '../../../../utils/preferences'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {selectedLanguageAtom} from './atoms'
import LanguageSelect from './components/LanguageSelect'
import NitroPhoneCooperation from './components/NitroPhoneCooperation'

export const changeLanguageActionAtom = atom(null, async (get, set) => {
  const {t} = get(translationAtom)

  await pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: LanguageSelect,
          positiveButtonText: t('common.change'),
          negativeButtonText: t('common.close'),
        },
      ],
    }),
    effectToTaskEither,
    TE.match(
      () => {},
      () => {
        set(currentAppLanguageAtom, get(selectedLanguageAtom))
      }
    )
  )()
})

export const showVexlNitroPhoneCooperationBannerActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithChildren',
              MainSectionComponent: NitroPhoneCooperation,
              negativeButtonText: t('common.close'),
              positiveButtonText: t('phoneCooperation.visitWebsite'),
            },
          ],
        })
      )

      void Linking.openURL(t('phoneCooperation.nitroPhoneWeb'))
    }).pipe(Effect.ignore)
  }
)
