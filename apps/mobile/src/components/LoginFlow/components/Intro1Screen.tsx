import {
  FaqStayAnonymous,
  Stack,
  Typography,
  VexlTextGraphic,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {useWindowDimensions} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  ANALYTICS_STATE_STORAGE_KEY,
  ensureAnalyticsUuidAndReportFirstStartActionAtom,
} from '../../../state/analytics/atoms'
import clearMmkvStorageAndEmptyAtoms from '../../../utils/clearMmkvStorageAndEmptyAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showTosSummaryForAlreadyLoggedInUserAtom} from '../../../utils/preferences'
import LoginFlowScreen, {
  LoginFlowCentered,
  LoginFlowText,
  LoginFlowTitle,
} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'Intro1'>

export default function Intro1Screen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const faqGraphicScale = Math.min(1, availableWidth / 330)
  const setShowTosSummaryForAlreadyLoggedInUser = useSetAtom(
    showTosSummaryForAlreadyLoggedInUserAtom
  )
  const ensureAnalyticsUuidAndReportFirstStart = useSetAtom(
    ensureAnalyticsUuidAndReportFirstStartActionAtom
  )

  useEffect(() => {
    setShowTosSummaryForAlreadyLoggedInUser(false)
    ensureAnalyticsUuidAndReportFirstStart()
  }, [
    ensureAnalyticsUuidAndReportFirstStart,
    setShowTosSummaryForAlreadyLoggedInUser,
  ])

  return (
    <LoginFlowScreen
      action={{
        label: t('loginFlow.v2.intro1.action'),
        onPress: () => {
          clearMmkvStorageAndEmptyAtoms({
            preserveKeys: [ANALYTICS_STATE_STORAGE_KEY],
          })
          navigation.navigate('Intro2')
        },
      }}
      footer={
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {t('loginFlow.v2.intro1.termsPrefix')}{' '}
          <Typography
            color="$accentYellowPrimary"
            onPress={() => {
              navigation.navigate('TermsAndConditions')
            }}
            textDecorationLine="underline"
            variant="paragraphSmall"
          >
            {t('loginFlow.start.termsOfUse')}
          </Typography>
          .
        </Typography>
      }
      header={
        <Stack alignItems="center" mt="$5">
          <VexlTextGraphic animate height={27} />
        </Stack>
      }
    >
      <LoginFlowCentered>
        <YStack alignItems="center" gap="$9" width="100%">
          <FaqStayAnonymous
            animate
            height={236 * faqGraphicScale}
            width={330 * faqGraphicScale}
          />
          <YStack gap="$4" width="100%">
            <LoginFlowTitle>{t('loginFlow.v2.intro1.title')}</LoginFlowTitle>
            <LoginFlowText>{t('loginFlow.v2.intro1.text')}</LoginFlowText>
          </YStack>
        </YStack>
      </LoginFlowCentered>
    </LoginFlowScreen>
  )
}
