import {Typography, UsageStatisticsGraphic, YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {analyticsBlogPostUrl, analyticsOptInAtom} from '../../utils/analytics'
import {useTranslation} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import PostLoginFlowScreen from '../PostLoginFlow/components/PostLoginFlowScreen'

export default function AnalyticsConsent({
  onAnswered,
}: {
  readonly onAnswered?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const graphicScale = Math.min(1, (windowWidth - 40) / 330)
  const setAnalyticsOptIn = useSetAtom(analyticsOptInAtom)

  const answer = (enabled: boolean) => () => {
    setAnalyticsOptIn(enabled)
    onAnswered?.()
  }

  return (
    <PostLoginFlowScreen
      primaryButton={{label: t('common.yes'), onPress: answer(true)}}
      secondaryButton={{label: t('common.no'), onPress: answer(false)}}
    >
      <YStack alignItems="center" flex={1} justifyContent="center" gap="$9">
        <UsageStatisticsGraphic
          animate
          height={235 * graphicScale}
          width={330 * graphicScale}
        />
        <YStack alignItems="center" gap="$4" width="100%">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="heading3"
          >
            {t('analyticsConsent.title')}
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {t('analyticsConsent.text')}{' '}
            <Typography
              color="$accentYellowPrimary"
              onPress={openUrl(analyticsBlogPostUrl)}
              textDecorationLine="underline"
              variant="paragraphSmall"
            >
              {t('analyticsConsent.link')}
            </Typography>
          </Typography>
        </YStack>
      </YStack>
    </PostLoginFlowScreen>
  )
}
