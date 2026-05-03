import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {Button, Copy, tokens, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {SATOSHIS_IN_BTC} from '../../../../../state/currentBtcPriceAtoms'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
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
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

function TradeChecklistAmountView({message}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
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
  const copyActionGap = tokens.space[2].val
  const copyActionMinWidth = tokens.size[13].val

  const onConfirmOrEditPress = useCallback(() => {
    navigation.navigate('TradeChecklistFlow', {
      screen: 'ConfirmAmount',
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
    const amountQuote = `${fiatAmount.toLocaleString(currentLocale)} ${currencies[tradeOrOriginOfferCurrency].code} = ${btcAmount} BTC`
    const feeText = `${t('messages.fee')}${feeAmount}`
    const exchangeRate = `${t('messages.exchangeRate')}${btcTradePrice} ${currencies[tradeOrOriginOfferCurrency].code}`

    const amountDescription = `${amountQuote}\n${feeText}\n${exchangeRate}`

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
          mb="$2"
          description={introText ?? amountDescription}
          details={introText ? [amountDescription] : undefined}
          statusLabel={statusLabel}
          statusVariant={statusVariant}
          title={t('messages.confirmAmount')}
        >
          <YStack gap="$3">
            {latestAmountDataMessage.status === 'accepted' && (
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
            )}
            {!isMessageOutdated &&
              latestAmountDataMessage.by === 'them' &&
              latestAmountDataMessage.status === 'pending' && (
                <XStack gap={copyActionGap}>
                  <Button
                    disabled={!amountData?.received}
                    f={1}
                    onPress={onConfirmOrEditPress}
                    size="medium"
                    variant="primary"
                  >
                    {t('messages.confirmOrEdit')}
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
