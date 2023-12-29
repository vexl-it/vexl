import {useAtomValue, useSetAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../../../atoms'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import VexlbotBubble from './VexlbotBubble'
import {getTokens, Stack, XStack} from 'tamagui'
import Button from '../../../../Button'
import Clipboard from '@react-native-clipboard/clipboard'
import {SATOSHIS_IN_BTC} from '../../../../TradeChecklistFlow/components/CalculateAmountFlow/atoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import copySvg from '../../../images/copySvg'
import {currencies} from '../../../../../utils/localization/currency'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useCallback, useMemo} from 'react'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import {
  addAmountActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {
  currentBtcPriceAtom,
  fetchBtcPriceActionAtom,
} from '../../../../../state/currentBtcPriceAtoms'
import TradeChecklistNetworkSetupSuggestionView from './TradeChecklistNetworkSetupSuggestionView'
import {calculateBtcPricePercentageDifference} from '../../../../../state/tradeChecklist/utils/amount'

function TradeChecklistAmountView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    offerForChatAtom,
    otherSideDataAtom,
    tradeChecklistAmountAtom,
  } = useMolecule(chatMolecule)
  const offerForChat = useAtomValue(offerForChatAtom)
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
  const currentBtcPrice = useAtomValue(currentBtcPriceAtom)
  const fetchBtcPrice = useSetAtom(fetchBtcPriceActionAtom)

  const btcPricePercentageDifference = useMemo(
    () =>
      calculateBtcPricePercentageDifference(
        amountDataToDisplay,
        currentBtcPrice
      ),
    [amountDataToDisplay, currentBtcPrice]
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

  useFocusEffect(
    useCallback(() => {
      if (offerForChat?.offerInfo.publicPart.currency) {
        void fetchBtcPrice(offerForChat.offerInfo.publicPart.currency)()
      }
    }, [fetchBtcPrice, offerForChat?.offerInfo.publicPart.currency])
  )

  if (!amountDataToDisplay?.amountData.btcAmount) return null

  const renderFooter = ((): JSX.Element | null => {
    if (amountDataToDisplay.status === 'accepted') {
      return (
        <>
          {amountDataToDisplay.amountData.btcAmount && (
            <Button
              text={'BTC'}
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${amountDataToDisplay.amountData.btcAmount}`
                )
              }}
              size={'small'}
              variant={'primary'}
              iconFill={getTokens().color.main.val}
            />
          )}
          {amountDataToDisplay.amountData.btcAmount && (
            <Button
              text={'SAT'}
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
              size={'small'}
              variant={'primary'}
              iconFill={getTokens().color.main.val}
            />
          )}
          {amountDataToDisplay.amountData.fiatAmount && (
            <Button
              text={
                currencies[offerForChat?.offerInfo.publicPart.currency ?? 'USD']
                  .code
              }
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${amountDataToDisplay.amountData.fiatAmount}`
                )
              }}
              size={'small'}
              variant={'primary'}
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
          variant={'secondary'}
          size={'small'}
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
                    navigateBackToChatOnSave: true,
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
            fiatCurrency:
              currencies[offerForChat?.offerInfo.publicPart.currency ?? 'USD']
                .code,
            feeAmount: amountDataToDisplay.amountData.feeAmount,
          }
        )}
      >
        <XStack f={1} ai={'center'} jc={'space-between'}>
          {renderFooter}
        </XStack>
      </VexlbotBubble>
      {amountDataToDisplay.status === 'accepted' && (
        <TradeChecklistNetworkSetupSuggestionView />
      )}
    </Stack>
  )
}

export default TradeChecklistAmountView
