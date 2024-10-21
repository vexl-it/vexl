import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../../../state/currentBtcPriceAtoms'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../../utils/localization/currency'
import {preferencesAtom} from '../../../../../utils/preferences'
import Button from '../../../../Button'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {type ToastNotificationState} from '../../../../ToastNotification/domain'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {chatMolecule} from '../../../atoms'
import copySvg from '../../../images/copySvg'
import checkIconSvg from '../../images/checkIconSvg'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistAmountView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistAmountAtom,
    tradeOrOriginOfferCurrencyAtom,
    fiatValueToDisplayInVexlbotMessageAtom,
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom,
  } = useMolecule(chatMolecule)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()
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
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const fiatAmount = useAtomValue(fiatValueToDisplayInVexlbotMessageAtom)
  const btcPricePercentageDifference = useAtomValue(
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom
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

  if (!amountDataToDisplay?.amountData.btcAmount) return null

  const renderFooter = ((): JSX.Element | null => {
    if (amountDataToDisplay.status !== 'pending') {
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
                setToastNotification(toastContent)
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
                  `${Math.round(Number(amountDataToDisplay.amountData.btcAmount) * SATOSHIS_IN_BTC)}`
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
        </>
      )
    }

    if (
      amountDataToDisplay.by === 'them' &&
      amountDataToDisplay.status === 'pending'
    ) {
      return (
        <XStack ai="center" jc="space-between" space="$2">
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
            btcAmount: Number(
              amountDataToDisplay.amountData.btcAmount
            )?.toLocaleString(currentLocale, {
              minimumFractionDigits:
                String(amountDataToDisplay.amountData.btcAmount).split('.')[1]
                  ?.length ?? 0,
              maximumFractionDigits:
                String(amountDataToDisplay.amountData.btcAmount).split('.')[1]
                  ?.length ?? 0,
            }),
            fiatAmount: fiatAmount?.toLocaleString(currentLocale),
            fiatCurrency: currencies[tradeOrOriginOfferCurrency].code,
            feeAmount: amountDataToDisplay.amountData.feeAmount,
            btcTradePrice:
              amountDataToDisplay.amountData.btcPrice?.toLocaleString(
                currentLocale
              ),
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
