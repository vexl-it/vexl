import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import GoldenAvatarInfoModalContent from './components/GoldenAvatarInfoModalContent'

export const showGoldenAvatarInfoModalActionAton = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: GoldenAvatarInfoModalContent,
          positiveButtonText: t('common.close'),
          negativeButtonText: t('common.more'),
        },
      ],
      variant: 'info',
    }),
    taskEitherToEffect,
    Effect.match({
      onFailure: () => {
        openUrl(t('common.communityUrl'))()
      },
      onSuccess: () => {},
    }),
    Effect.runFork
  )
})
