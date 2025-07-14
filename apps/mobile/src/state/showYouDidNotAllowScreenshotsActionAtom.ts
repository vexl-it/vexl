import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {askAreYouSureActionAtom} from '../components/AreYouSureDialog'
import {translationAtom} from '../utils/localization/I18nProvider'
import {preferencesAtom} from '../utils/preferences'

export const screenshotsDisabledAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('disableScreenshots')
)

export const showYouDidNotAllowTakingScreenshotsActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)
    const screenshotsDisabledAtom = focusAtom(preferencesAtom, (o) =>
      o.prop('disableScreenshots')
    )
    const screenshotsDisabled = get(screenshotsDisabledAtom)

    if (!screenshotsDisabled) return Effect.void

    return pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithText',
            title: t('settings.screenshotsNotAllowed'),
            description: t('settings.disabledScreenShots'),
            positiveButtonText: t('common.close'),
          },
        ],
        variant: 'info',
      }),
      Effect.ignore
    )
  }
)
