import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {SATOSHIS_IN_BTC} from '../../../../../state/currentBtcPriceAtoms'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../../utils/localization/currency'
import {preferencesAtom} from '../../../../../utils/preferences'
import Button from '../../../../Button'
import showDonationPromptGiveLoveActionAtom from '../../../../DonationPrompt/atoms/showDonationPromptGiveLoveActionAtom'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {type ToastNotificationState} from '../../../../ToastNotification/domain'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import checkIconSvg from '../../../../images/checkIconSvg'
import copySvg from '../../../../images/copySvg'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

function TradeChecklistAmountView({message}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistAmountAtom,
    tradeOrOriginOfferCurrencyAtom,
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom,
  } = useMolecule(chatMolecule)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
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
  const showDonationPromptGiveLove = useSetAtom(
    showDonationPromptGiveLoveActionAtom
  )

  const toastContent: ToastNotificationState = useMemo(
    () => ({
      visible: true,
      text: t('common.copied'),
      icon: checkIconSvg,
    }),
    [t]
  )

  const onAcceptButtonPress = useCallback(() => {
    if (amountData.received) {
      showLoadingOverlay(true)
      addAmount(amountData?.received)
      void submitTradeChecklistUpdates()().finally(() => {
        showLoadingOverlay(false)
      })
      Effect.runFork(showDonationPromptGiveLove())
    }
  }, [
    addAmount,
    amountData.received,
    showDonationPromptGiveLove,
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

    return (
      <>
        <VexlbotBubble
          messageState={message.state}
          username={otherSideData.userName}
          status={
            isMessageOutdated
              ? ('outdated' as const)
              : latestAmountDataMessage.status
          }
          introText={
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
          }
          text={t(
            // vexlbot.settledAmountOfTheDeal and vexlbot.suggestedAmountOfTheDeal are accidentally swapped in translation file
            latestAmountDataMessage.status === 'pending' || isMessageOutdated
              ? 'vexlbot.settledAmountOfTheDeal'
              : 'vexlbot.suggestedAmountOfTheDeal',
            {
              username:
                message.state === 'sent'
                  ? t('common.you')
                  : otherSideData.userName,
              btcAmount: Number(
                message.message.tradeChecklistUpdate.amount.btcAmount
              )?.toLocaleString(currentLocale, {
                minimumFractionDigits:
                  String(
                    message.message.tradeChecklistUpdate.amount.btcAmount
                  ).split('.')[1]?.length ?? 0,
                maximumFractionDigits:
                  String(
                    message.message.tradeChecklistUpdate.amount.btcAmount
                  ).split('.')[1]?.length ?? 0,
              }),
              fiatAmount: fiatAmount?.toLocaleString(currentLocale),
              fiatCurrency: currencies[tradeOrOriginOfferCurrency].code,
              feeAmount: message.message.tradeChecklistUpdate.amount.feeAmount,
              btcTradePrice:
                message.message.tradeChecklistUpdate.amount.btcPrice?.toLocaleString(
                  currentLocale
                ),
            }
          )}
        >
          <Stack f={1} gap="$2">
            <XStack ai="center" jc="space-between">
              {!!message.message.tradeChecklistUpdate.amount.btcAmount && (
                <Button
                  text="BTC"
                  beforeIcon={copySvg}
                  onPress={() => {
                    Clipboard.setString(
                      `${message.message.tradeChecklistUpdate?.amount?.btcAmount}`
                    )
                    setToastNotification(toastContent)
                  }}
                  size="small"
                  variant="primary"
                  iconFill={getTokens().color.main.val}
                />
              )}
              {!!message.message.tradeChecklistUpdate.amount.btcAmount && (
                <Button
                  text="SAT"
                  beforeIcon={copySvg}
                  onPress={() => {
                    Clipboard.setString(
                      `${Math.round(Number(message.message.tradeChecklistUpdate?.amount?.btcAmount) * SATOSHIS_IN_BTC)}`
                    )
                    setToastNotification(toastContent)
                  }}
                  size="small"
                  variant="primary"
                  iconFill={getTokens().color.main.val}
                />
              )}
              {!!fiatAmount && (
                <Button
                  text={currencies[tradeOrOriginOfferCurrency].code}
                  beforeIcon={copySvg}
                  onPress={() => {
                    Clipboard.setString(`${fiatAmount}`)
                    setToastNotification(toastContent)
                  }}
                  size="small"
                  variant="primary"
                  iconFill={getTokens().color.main.val}
                />
              )}
            </XStack>
            {!isMessageOutdated &&
              latestAmountDataMessage.by === 'them' &&
              latestAmountDataMessage.status === 'pending' && (
                <XStack ai="center" jc="space-between" gap="$2">
                  <Button
                    fullSize
                    disabled={!amountData?.received}
                    onPress={onEditPress}
                    variant="primary"
                    size="small"
                    text={t('common.change')}
                  />
                  <Button
                    fullSize
                    disabled={!amountData?.received}
                    onPress={onAcceptButtonPress}
                    variant="secondary"
                    size="small"
                    text={t('common.accept')}
                  />
                </XStack>
              )}
          </Stack>
        </VexlbotBubble>
        {!isMessageOutdated &&
          latestAmountDataMessage.status === 'accepted' && (
            <VexlbotNextActionSuggestion />
          )}
      </>
    )
  }

  return null
}

export default TradeChecklistAmountView
