import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {calculateBtcPricePercentageDifference} from '../../../../../state/tradeChecklist/utils/amount'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../../utils/localization/currency'
import Button from '../../../../Button'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {SATOSHIS_IN_BTC} from '../../../../TradeChecklistFlow/components/CalculateAmountFlow/atoms'
import {chatMolecule} from '../../../atoms'
import copySvg from '../../../images/copySvg'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistAmountView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistAmountAtom,
    btcPriceForTradeCurrencyAtom,
    tradeOrOriginOfferCurrencyAtom,
  } = useMolecule(chatMolecule)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const amountData = useAtomValue(tradeChecklistAmountAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const amountDataToDisplay = amount.getAmountData(amountData)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const addAmount = useSetAtom(addAmountActionAtom)
  const btcPriceForTradeCurrency = useAtomValue(btcPriceForTradeCurrencyAtom)

  const btcPricePercentageDifference = useMemo(
    () =>
      calculateBtcPricePercentageDifference(
        amountDataToDisplay,
        btcPriceForTradeCurrency?.btcPrice
      ),
    [amountDataToDisplay, btcPriceForTradeCurrency?.btcPrice]
  )

  const onAcceptButtonPress = useCallback(() => {
    if (amountData.received) {
      showLoadingOverlay(true)
      addAmount(amountData?.received)
      void submitTradeChecklistUpdates()().finally(() => {
        showLoadingOverlay(false)
      })
    }
  }, [
    addAmount,
    amountData.received,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
  ])

  if (!amountDataToDisplay?.amountData.btcAmount) return null

  const renderFooter = ((): JSX.Element | null => {
    if (amountDataToDisplay.status === 'accepted') {
      return (
        <>
          {!!amountDataToDisplay.amountData.btcAmount && (
            <Button
              text="BTC"
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${amountDataToDisplay.amountData.btcAmount}`
                )
              }}
              size="small"
              variant="primary"
              iconFill={getTokens().color.main.val}
            />
          )}
          {!!amountDataToDisplay.amountData.btcAmount && (
            <Button
              text="SAT"
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${
                    amountDataToDisplay.amountData.btcAmount
                      ? Math.round(
                          amountDataToDisplay.amountData.btcAmount *
                            SATOSHIS_IN_BTC
                        )
                      : 0
                  }`
                )
              }}
              size="small"
              variant="primary"
              iconFill={getTokens().color.main.val}
            />
          )}
          {!!amountDataToDisplay.amountData.fiatAmount && (
            <Button
              text={currencies[tradeOrOriginOfferCurrency].code}
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${amountDataToDisplay.amountData.fiatAmount}`
                )
              }}
              size="small"
              variant="primary"
              iconFill={getTokens().color.main.val}
            />
          )}
        </>
      )
    }

    if (
      amountDataToDisplay.by === 'them' &&
      amountDataToDisplay.status === 'pending'
    ) {
      return (
        <Button
          fullWidth
          disabled={!amountData?.received}
          onPress={onAcceptButtonPress}
          variant="secondary"
          size="small"
          text={t('common.accept')}
        />
      )
    }

    return null
  })()

  return (
    <Stack>
      <VexlbotBubble
        status={
          amountDataToDisplay.by === 'them' &&
          amountDataToDisplay.status === 'pending'
            ? undefined
            : amountDataToDisplay.status
        }
        onEditPress={
          amountDataToDisplay.by === 'them' &&
          amountDataToDisplay.status === 'pending'
            ? () => {
                navigation.navigate('TradeChecklistFlow', {
                  screen: 'CalculateAmount',
                  params: {
                    amountData: {
                      ...amountData.received,
                      // on the side of receiver we need to map the type to custom but preserve it on side of creator (for edit trade price purposes)
                      tradePriceType:
                        amountData.received?.tradePriceType === 'your'
                          ? 'custom'
                          : amountData.received?.tradePriceType,
                    },
                  },
                  chatId,
                  inboxKey,
                })
              }
            : undefined
        }
        introText={
          amountDataToDisplay.status !== 'accepted' &&
          amountDataToDisplay.by === 'them' &&
          (amountDataToDisplay.amountData.tradePriceType === 'custom' ||
            amountDataToDisplay.amountData.tradePriceType === 'your' ||
            amountDataToDisplay.amountData.tradePriceType === 'frozen')
            ? `${t(
                'tradeChecklist.calculateAmount.choseToCalculateWithCustomPrice',
                {
                  username: otherSideData.userName,
                  percentage: Math.abs(btcPricePercentageDifference),
                }
              )} ${
                btcPricePercentageDifference >= 0
                  ? t('vexlbot.higherThanLivePrice')
                  : t('vexlbot.lowerThanLivePrice')
              }`
            : undefined
        }
        text={t(
          amountDataToDisplay.status === 'pending'
            ? 'vexlbot.settledAmountOfTheDeal'
            : 'vexlbot.suggestedAmountOfTheDeal',
          {
            username:
              amountDataToDisplay.by === 'me'
                ? t('common.you')
                : otherSideData.userName,
            btcAmount: amountDataToDisplay.amountData.btcAmount,
            fiatAmount: amountDataToDisplay.amountData.fiatAmount,
            fiatCurrency: currencies[tradeOrOriginOfferCurrency].code,
            feeAmount: amountDataToDisplay.amountData.feeAmount,
          }
        )}
      >
        <XStack f={1} ai="center" jc="space-between">
          {renderFooter}
        </XStack>
      </VexlbotBubble>
    </Stack>
  )
}

export default TradeChecklistAmountView
