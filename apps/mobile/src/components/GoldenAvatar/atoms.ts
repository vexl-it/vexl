import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {translationAtom} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import {globalDialogAtom} from '../GlobalDialog'
import GoldenAvatarInfoModalContent from './components/GoldenAvatarInfoModalContent'

export const showGoldenAvatarInfoModalActionAton = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(globalDialogAtom, {
      title: t('goldenGlasses.userJoinedOneOfOurChosenVexlMeetups'),
      subtitle: t('goldenGlasses.goAndTryToFindYours'),
      children: React.createElement(GoldenAvatarInfoModalContent, {
        showTitle: false,
        showDescription: false,
      }),
      positiveButtonText: t('common.close'),
      negativeButtonText: t('common.more'),
    }),
    Effect.match({
      onFailure: () => {},
      onSuccess: (confirmed) => {
        if (confirmed) return
        openUrl(t('common.communityUrl'))()
      },
    }),
    Effect.runFork
  )
})
