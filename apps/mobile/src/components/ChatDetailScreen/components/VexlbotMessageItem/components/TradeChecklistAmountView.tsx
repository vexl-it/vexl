import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Button,
  Copy,
  darkTheme,
  lightTheme,
  tokens,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {SATOSHIS_IN_BTC} from '../../../../../state/currentBtcPriceAtoms'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {andThenExpectBooleanNoErrors} from '../../../../../utils/andThenExpectNoErrors'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../../utils/localization/currency'
import {
  localizedDecimalNumberActionAtom,
  localizedPercentActionAtom,
} from '../../../../../utils/localization/localizedNumbersAtoms'
import {preferencesAtom} from '../../../../../utils/preferences'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

function TradeChecklistAmountView({message}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const theme = useTheme()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistAmountAtom,
    tradeOrOriginOfferCurrencyAtom,
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom,
    lastTradeChecklistMessageAtom,
  } = useMolecule(chatMolecule)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const lastTradeChecklistMessage = useAtomValue(lastTradeChecklistMessageAtom)
  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()
  const amountData = useAtomValue(tradeChecklistAmountAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const latestAmountDataMessage = amount.getLatestAmountDataMessage(amountData)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const addAmount = useSetAtom(addAmountActionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const btcPricePercentageDifference = useAtomValue(
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom
  )
  const btcTradePrice = useSetAtom(localizedDecimalNumberActionAtom)({
    number:
      message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
        ? (message.message.tradeChecklistUpdate?.amount?.btcPrice ?? 0)
        : 0,
  })
  const btcAmount = useSetAtom(localizedDecimalNumberActionAtom)({
    number:
      message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
        ? (message.message.tradeChecklistUpdate?.amount?.btcAmount ?? 0)
        : 0,
    minimumFractionDigits:
      message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
        ? (message.message.tradeChecklistUpdate?.amount?.btcAmount
            ?.toString()
            .split('.')[1]?.length ?? 0)
        : 0,
  })
  const feeAmount = useSetAtom(localizedPercentActionAtom)({
    number:
      message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
        ? message.message.tradeChecklistUpdate?.amount?.feeAmount
          ? message.message.tradeChecklistUpdate.amount.feeAmount / 100
          : 0
        : 0,
  })

  const toastContent = t('common.copied')
  const copyActionIconSize = tokens.size[6].val
  const copyActionGap = tokens.space[2].val
  const copyActionMinWidth = tokens.size[13].val
  const isDarkTheme =
    theme.backgroundPrimary.val === darkTheme.backgroundPrimary
  const copyActionIconColor = isDarkTheme
    ? darkTheme.accentHighlightPrimary
    : lightTheme.accentHighlightPrimary

  const onAcceptButtonPress = useCallback(() => {
    if (amountData.received) {
      showLoadingOverlay(true)
      addAmount(amountData?.received)
      void Effect.runPromise(
        andThenExpectBooleanNoErrors((success) => {
          showLoadingOverlay(false)
        })(submitTradeChecklistUpdates())
      )
    }
  }, [
    addAmount,
    amountData.received,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
  ])

  const onEditPress = useCallback(() => {
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
  }, [amountData.received, chatId, inboxKey, navigation])

  const copyValueToClipboard = useCallback(
    (value: string) => {
      Clipboard.setString(value)
      setToastNotification(toastContent)
    },
    [setToastNotification, toastContent]
  )

  if (!latestAmountDataMessage?.amountData.btcAmount) return null

  if (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
    message.message.tradeChecklistUpdate?.amount
  ) {
    const fiatAmount = amount.applyFeeOnNumberValue(
      message.message.tradeChecklistUpdate.amount.fiatAmount ?? 0,
      message.message.tradeChecklistUpdate.amount.feeAmount ?? 0
    )

    const isMessageOutdated =
      message.message.tradeChecklistUpdate.amount.timestamp !==
      latestAmountDataMessage.amountData.timestamp
    const introText =
      latestAmountDataMessage.status === 'pending' &&
      latestAmountDataMessage.by === 'them' &&
      (latestAmountDataMessage.amountData.tradePriceType === 'custom' ||
        latestAmountDataMessage.amountData.tradePriceType === 'your' ||
        latestAmountDataMessage.amountData.tradePriceType === 'frozen')
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
    const amountDescription = t(
      // vexlbot.settledAmountOfTheDeal and vexlbot.suggestedAmountOfTheDeal are accidentally swapped in translation file
      latestAmountDataMessage.status === 'pending' || isMessageOutdated
        ? 'vexlbot.settledAmountOfTheDeal'
        : 'vexlbot.suggestedAmountOfTheDeal',
      {
        username:
          message.state === 'sent' ? t('common.you') : otherSideData.userName,
        btcAmount,
        fiatAmount: fiatAmount?.toLocaleString(currentLocale),
        fiatCurrency: currencies[tradeOrOriginOfferCurrency].code,
        feeAmount,
        btcTradePrice,
      }
    )
    const pendingLabel =
      message.state === 'received'
        ? t('vexlbot.reactionRequired')
        : otherSideData.userName
          ? t('vexlbot.waitingFor', {username: otherSideData.userName})
          : t('vexlbot.waitingForCounterParty')
    const statusLabel = isMessageOutdated
      ? t('common.outdated')
      : latestAmountDataMessage.status === 'accepted'
        ? t('common.accepted')
        : pendingLabel
    const statusVariant = isMessageOutdated
      ? 'outdated'
      : latestAmountDataMessage.status === 'accepted'
        ? 'waiting'
        : 'waitingForConfirmation'

    return (
      <>
        <VexlbotActionCard
          description={introText ?? amountDescription}
          details={introText ? [amountDescription] : undefined}
          statusLabel={statusLabel}
          statusVariant={statusVariant}
          title={t('tradeChecklist.options.CALCULATE_AMOUNT')}
        >
          <YStack gap="$3">
            <XStack flexWrap="wrap" gap={copyActionGap}>
              {!!message.message.tradeChecklistUpdate.amount.btcAmount && (
                <Button
                  f={1}
                  icon={Copy}
                  minWidth={copyActionMinWidth}
                  onPress={() => {
                    copyValueToClipboard(
                      `${message.message.tradeChecklistUpdate?.amount?.btcAmount}`
                    )
                  }}
                  size="small"
                  variant="secondary"
                >
                  BTC
                </Button>
              )}
              {!!message.message.tradeChecklistUpdate.amount.btcAmount && (
                <Button
                  f={1}
                  icon={Copy}
                  minWidth={copyActionMinWidth}
                  onPress={() => {
                    copyValueToClipboard(
                      `${Math.round(Number(message.message.tradeChecklistUpdate?.amount?.btcAmount) * SATOSHIS_IN_BTC)}`
                    )
                  }}
                  size="small"
                  variant="secondary"
                >
                  SAT
                </Button>
              )}
              {!!fiatAmount && (
                <Button
                  f={1}
                  icon={Copy}
                  minWidth={copyActionMinWidth}
                  onPress={() => {
                    copyValueToClipboard(`${fiatAmount}`)
                  }}
                  size="small"
                  variant="secondary"
                >
                  {currencies[tradeOrOriginOfferCurrency].code}
                </Button>
              )}
            </XStack>
            {!isMessageOutdated &&
              latestAmountDataMessage.by === 'them' &&
              latestAmountDataMessage.status === 'pending' && (
                <XStack gap={copyActionGap}>
                  <Button
                    disabled={!amountData?.received}
                    f={1}
                    onPress={onEditPress}
                    size="small"
                    variant="primary"
                  >
                    {t('common.change')}
                  </Button>
                  <Button
                    disabled={!amountData?.received}
                    f={1}
                    onPress={onAcceptButtonPress}
                    size="small"
                    variant="secondary"
                  >
                    {t('common.accept')}
                  </Button>
                </XStack>
              )}
          </YStack>
        </VexlbotActionCard>
        {!isMessageOutdated &&
          latestAmountDataMessage.status === 'accepted' &&
          Option.isSome(lastTradeChecklistMessage) &&
          lastTradeChecklistMessage.value.message.uuid ===
            message.message.uuid && <VexlbotNextActionSuggestion />}
      </>
    )
  }

  return null
}

export default TradeChecklistAmountView
