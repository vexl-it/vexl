import {atom} from 'jotai'
import {translationAtom} from '../utils/localization/I18nProvider'
import {pipe} from 'fp-ts/function'
import {askAreYouSureActionAtom} from '../components/AreYouSureDialog'
import * as TE from 'fp-ts/TaskEither'
import {focusAtom} from 'jotai-optics'
import {preferencesAtom} from '../utils/preferences'

export const screenshotsDisabledAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('disableScreenshots')
)
export const showYouDidNotAllowTakingScreenshotsActionAtom = atom(
  null,
  async (get, set) => {
    const {t} = get(translationAtom)
    const screenshotsDisabledAtom = focusAtom(preferencesAtom, (o) =>
      o.prop('disableScreenshots')
    )
    const screenshotsDisabled = get(screenshotsDisabledAtom)

    if (screenshotsDisabled) {
      await pipe(
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('settings.screenshotsNotAllowed'),
              description: t('settings.otherUserDisabledScreenshots'),
              positiveButtonText: t('common.close'),
            },
          ],
          variant: 'info',
        }),
        TE.match(
          () => {},
          () => {}
        )
      )()
    }
  }
)
