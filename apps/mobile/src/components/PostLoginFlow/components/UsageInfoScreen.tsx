import {type TradingIntent} from '@vexl-next/domain/src/general/quickOffers'
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
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {submitUsageInfoActionAtom} from '../../../state/postLoginOnboarding'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import QuickOffersSwitch from '../../QuickOffersSwitch'
import PostLoginFlowScreen from './PostLoginFlowScreen'

export default function UsageInfoScreen(): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 164)
  const submitUsageInfo = useSetAtom(submitUsageInfoActionAtom)
  const loadingOverlay = useShowLoadingOverlay()
  const finishInProgressRef = useRef(false)
  const [quickOffersEnabledAtom] = useState(() => atom(true))
  const quickOffersEnabled = useAtomValue(quickOffersEnabledAtom)

  const finish = useCallback(
    (tradingIntent: TradingIntent): void => {
      if (finishInProgressRef.current) return

      finishInProgressRef.current = true
      loadingOverlay.show()

      void Effect.runPromise(
        submitUsageInfo({tradingIntent, quickOffersEnabled})
      ).finally(() => {
        finishInProgressRef.current = false
        loadingOverlay.hide()
      })
    },
    [loadingOverlay, quickOffersEnabled, submitUsageInfo]
  )

  return (
    <PostLoginFlowScreen>
      <YStack flex={1} justifyContent="space-between" paddingTop="$10" gap="$5">
        <YStack f={1} gap="$7" alignItems="center" justifyContent="center">
          <FaqWhatIsVexl
            animate
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
        <YStack gap="$5">
          <YStack gap="$3">
            <Selector
              icon={CurrencyBitcoinCircle}
              label={t('postLoginFlow.v2.usageInfo.getBitcoin')}
              onPress={() => {
                finish('BUY')
              }}
            />
            <Selector
              icon={BoxProduct}
              label={t('postLoginFlow.v2.usageInfo.spendBitcoin')}
              onPress={() => {
                finish('SELL')
              }}
            />
            <Selector
              icon={TelescopeExplore}
              label={t('postLoginFlow.v2.usageInfo.doBoth')}
              onPress={() => {
                finish('BOTH')
              }}
            />
          </YStack>
          <QuickOffersSwitch valueAtom={quickOffersEnabledAtom} />
        </YStack>
      </YStack>
    </PostLoginFlowScreen>
  )
}
