import Clipboard from '@react-native-clipboard/clipboard'
import {Button, Copy, Typography, XStack, YStack} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {
  chatWithMessagesKeys,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../../../utils/localization/currency'
import {formatInteger} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import {localizedDecimalNumberActionAtom} from '../../../../../../utils/localization/localizedNumbersAtoms'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {toastNotificationAtom} from '../../../../../ToastNotification/atom'
import {applyFee, btcToSat} from '../../../../../TradeCalculator/helpers'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'

type Props = TradeChecklistStackScreenProps<'ConfirmAmount'>

function ConfirmAmountScreen({
  navigation,
  route: {
    params: {amountData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const currentLocale = useAtomValue(formattingLocaleAtom)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const addAmount = useSetAtom(addAmountActionAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const formatDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()

  const fiatAmount = applyFee(
    amountData?.fiatAmount ?? 0,
    amountData?.feeAmount ?? 0
  )
  const roundedFiatAmount = Math.round(fiatAmount)
  const selectedCurrency =
    amountData?.currency ?? tradeOrOriginOfferCurrency ?? 'EUR'
  const fiatCurrency = currencies[selectedCurrency].code
  const btcAmount = formatDecimalNumber({
    number: amountData?.btcAmount ?? 0,
    minimumFractionDigits:
      amountData?.btcAmount?.toString().split('.')[1]?.length ?? 0,
  })

  const copyValueToClipboard = useCallback(
    (value: string) => {
      Clipboard.setString(value)
      setToastNotification(t('common.copied'))
    },
    [setToastNotification, t]
  )

  const onAcceptButtonPress = useCallback(() => {
    if (!amountData) return

    addAmount(amountData)
    if (!shouldNavigateBackToChatOnSave) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

    showLoadingOverlay(true)
    void Effect.runPromise(submitTradeChecklistUpdates())
      .then((success) => {
        if (!success) return
        navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
      })
      .finally(() => {
        showLoadingOverlay(false)
      })
  }, [
    addAmount,
    amountData,
    navigation,
    shouldNavigateBackToChatOnSave,
    showLoadingOverlay,
    store,
    submitTradeChecklistUpdates,
  ])

  const onSuggestDifferentAmountPress = useCallback(() => {
    navigation.navigate('CalculateAmount', {
      amountData,
    })
  }, [amountData, navigation])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('messages.confirmAmount'),
      }}
      bottomButton={{
        disabled: !amountData,
        onPress: onAcceptButtonPress,
        text: t('common.accept'),
        variant: 'primary',
      }}
      scrollable={false}
    >
      <YStack flex={1} gap="$7" pt="$4">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          gap="$3"
          padding="$5"
        >
          <YStack alignItems="center" gap="$2">
            <Typography
              variant="graphPrice"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {`${formatInteger(roundedFiatAmount, currentLocale)} ${fiatCurrency}`}
            </Typography>
            <Typography
              variant="paragraphSmall"
              color="$foregroundSecondary"
              textAlign="center"
            >
              {`${btcAmount} BTC`}
            </Typography>
          </YStack>
          <Button
            alignSelf="stretch"
            onPress={onSuggestDifferentAmountPress}
            size="small"
            variant="secondary"
          >
            {t('tradeChecklist.calculateAmount.suggestDifferentAmount')}
          </Button>
        </YStack>
        <XStack flexWrap="wrap" gap="$3">
          {!!amountData?.btcAmount && (
            <Button
              flex={1}
              icon={Copy}
              minWidth="$13"
              onPress={() => {
                copyValueToClipboard(`${amountData.btcAmount}`)
              }}
              size="small"
              variant="secondary"
            >
              BTC
            </Button>
          )}
          {!!amountData?.btcAmount && (
            <Button
              flex={1}
              icon={Copy}
              minWidth="$13"
              onPress={() => {
                copyValueToClipboard(btcToSat(amountData.btcAmount ?? 0))
              }}
              size="small"
              variant="secondary"
            >
              SAT
            </Button>
          )}
          {!!fiatAmount && (
            <Button
              flex={1}
              icon={Copy}
              minWidth="$13"
              onPress={() => {
                copyValueToClipboard(`${roundedFiatAmount}`)
              }}
              size="small"
              variant="secondary"
            >
              {fiatCurrency}
            </Button>
          )}
        </XStack>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default ConfirmAmountScreen
