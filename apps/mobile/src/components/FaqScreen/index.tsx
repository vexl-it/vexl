import {
  NavigationBar,
  Screen,
  StoryPager,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import useContent, {type FaqContent, type FaqType} from './useContent'

type Props = RootStackScreenProps<'Faqs'>

function getInitialPage(
  content: readonly FaqContent[],
  pageType: FaqType | undefined
): number {
  if (!pageType) return 0

  return pipe(
    content,
    Array.findFirstIndex((one) => one.type === pageType),
    Option.getOrElse(() => 0)
  )
}

function FaqsScreen({route: {params}}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useContent()

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('faqs.faqsTitle')}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <StoryPager
        pages={content}
        initialPage={getInitialPage(content, params?.pageType)}
        backLabel={t('common.back')}
        nextLabel={t('common.next')}
        finishLabel={t('common.done')}
        onFinish={safeGoBack}
      />
    </Screen>
  )
}

export default FaqsScreen
