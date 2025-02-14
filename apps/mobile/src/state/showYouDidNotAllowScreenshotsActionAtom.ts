import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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
        effectToTaskEither,
        TE.match(
          () => {},
          () => {}
        )
      )()
    }
  }
)
