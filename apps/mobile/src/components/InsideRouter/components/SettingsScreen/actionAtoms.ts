import {Effect} from 'effect'
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

  await Effect.runPromise(
    Effect.gen(function* (_) {
      const confirmed = yield* _(
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
        Effect.option
      )

      if (confirmed._tag === 'Some') {
        set(currentAppLanguageAtom, get(selectedLanguageAtom))
      }
    })
  )
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
