import {
  BoxProduct,
  CurrencyBitcoinCircle,
  FaqWhatIsVexl,
  Selector,
  TelescopeExplore,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {
  completePostLoginFlowScreenActionAtom,
  finishPostLoginFlowActionAtom,
} from '../../../state/postLoginOnboarding'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import PostLoginFlowScreen from './PostLoginFlowScreen'

export default function UsageInfoScreen(): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 164)
  const completeScreen = useSetAtom(completePostLoginFlowScreenActionAtom)
  const finishPostLoginFlow = useSetAtom(finishPostLoginFlowActionAtom)

  const finish = (): void => {
    completeScreen('usageInfo')
    Effect.runFork(finishPostLoginFlow())
  }

  return (
    <PostLoginFlowScreen
      primaryButton={{
        label: t('common.continue'),
        onPress: finish,
      }}
    >
      <YStack
        flex={1}
        justifyContent="space-between"
        paddingVertical="$10"
        gap="$5"
      >
        <YStack alignItems="center" gap="$7">
          <FaqWhatIsVexl
            height={164 * graphicScale}
            width={164 * graphicScale}
          />
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="heading3"
          >
            {t('postLoginFlow.v2.usageInfo.title')}
          </Typography>
        </YStack>
        <YStack gap="$3">
          <Selector
            icon={CurrencyBitcoinCircle}
            label={t('postLoginFlow.v2.usageInfo.getBitcoin')}
            onPress={finish}
          />
          <Selector
            icon={BoxProduct}
            label={t('postLoginFlow.v2.usageInfo.spendBitcoin')}
            onPress={finish}
          />
          <Selector
            icon={TelescopeExplore}
            label={t('postLoginFlow.v2.usageInfo.doBoth')}
            onPress={finish}
          />
        </YStack>
      </YStack>
    </PostLoginFlowScreen>
  )
}
