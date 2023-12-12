import {atom} from 'jotai'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {pipe} from 'fp-ts/function'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import LanguageSelect from './components/LanguageSelect'
import * as TE from 'fp-ts/TaskEither'
import {selectedLanguageAtom} from './atoms'
import {currentAppLanguageAtom} from '../../../../utils/preferences'

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
          negativeButtonText: t('common.back'),
        },
      ],
    }),
    TE.match(
      () => {},
      () => {
        set(currentAppLanguageAtom, get(selectedLanguageAtom))
      }
    )
  )()
})
