import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {currentAppLanguageAtom} from '../../../../utils/preferences'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {selectedLanguageAtom} from './atoms'
import LanguageSelect from './components/LanguageSelect'

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
    TE.match(
      () => {},
      () => {
        set(currentAppLanguageAtom, get(selectedLanguageAtom))
      }
    )
  )()
})
