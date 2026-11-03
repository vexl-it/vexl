import {
  FaqNoRatings,
  FaqStayAnonymous,
  NavigationBar,
  Screen,
  StoryPager,
  XmarkCancelClose,
  type StoryPage,
} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'
import useSafeGoBack from '../utils/useSafeGoBack'

function useWhatAreClubsContent(): readonly StoryPage[] {
  const {t} = useTranslation()

  return [
    {
      graphic: FaqStayAnonymous,
      title: t('suggestion.whatAreClubs2'),
      text: t('suggestion.whatAreClubs2Text'),
    },
    {
      graphic: FaqNoRatings,
      title: t('suggestion.howDoIJoinClub'),
      text: t('suggestion.howDoIJoinClubText'),
    },
  ]
}

function WhatAreClubsScreen(): React.JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useWhatAreClubsContent()

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('suggestion.whatAreClubs')}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <StoryPager
        pages={content}
        backLabel={t('common.back')}
        nextLabel={t('common.next')}
        finishLabel={t('common.close')}
        onFinish={safeGoBack}
      />
    </Screen>
  )
}

export default WhatAreClubsScreen
