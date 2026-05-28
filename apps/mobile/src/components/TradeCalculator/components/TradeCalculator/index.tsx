import {Button, Dialog, Exchange, InfoCircle, Typography} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {Stack, XStack, YStack, useTheme} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../utils/dismissKeyboardPromise'
import {
  getLocaleFromTranslation,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import {AnimatedLiveIndicator} from '../../../AnimatedLiveIndicator'
import {useOpenChangeCurrency} from '../../../ChangeCurrency'
import CurrentBtcPrice from '../../../CurrentBtcPrice'
import {globalDialogAtom} from '../../../GlobalDialog'
import {
  amountInputsSwappedAtom,
  btcInputValueAtom,
  btcOrSatAtom,
  btcPriceCurrencyAtom,
  btcPriceForOfferWithStateAtom,
  calculateBtcValueOnFiatAmountChangeActionAtom,
  calculateFiatValueAfterBtcPriceRefreshActionAtom,
  calculateFiatValueOnBtcAmountChangeActionAtom,
  fiatInputValueAtom,
  ownPriceAtom,
  ownPriceSaveButtonDisabledAtom,
  refreshCurrentBtcPriceActionAtom,
  saveYourPriceActionAtom,
  setFormDataBasedOnBtcPriceTypeActionAtom,
  showTradePriceTypeDialogActionAtom,
  switchBtcOrSatValueActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
  updateFiatCurrencyActionAtom,
} from '../../atoms'
import SetYourOwnPriceDialogContent from '../SetYourOwnPriceDialogContent'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'

interface Props {
  readonly children?: React.ReactNode
  readonly onPremiumOrDiscountPress: () => void
}

function TradeCalculator({
  children,
  onPremiumOrDiscountPress,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const [livePriceDialogVisible, setLivePriceDialogVisible] = useState(false)
  const amountInputsSwapped = useAtomValue(amountInputsSwappedAtom)
  const btcOrSat = useAtomValue(btcOrSatAtom)
  const btcInputValue = useAtomValue(btcInputValueAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const fiatCurrency = useAtomValue(btcPriceCurrencyAtom)
  const fiatInputValue = useAtomValue(fiatInputValueAtom)
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const calculateFiatValueAfterBtcPriceRefresh = useSetAtom(
    calculateFiatValueAfterBtcPriceRefreshActionAtom
  )
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const calculateFiatValueOnBtcAmountChange = useSetAtom(
    calculateFiatValueOnBtcAmountChangeActionAtom
  )
  const setAmountInputsSwapped = useSetAtom(amountInputsSwappedAtom)
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const setFormDataBasedOnBtcPriceType = useSetAtom(
    setFormDataBasedOnBtcPriceTypeActionAtom
  )
  const showTradePriceTypeDialog = useSetAtom(
    showTradePriceTypeDialogActionAtom
  )
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const setOwnPrice = useSetAtom(ownPriceAtom)
  const saveYourPrice = useSetAtom(saveYourPriceActionAtom)
  const switchBtcOrSatValue = useSetAtom(switchBtcOrSatValueActionAtom)
  const updateFiatCurrency = useSetAtom(updateFiatCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const locale = getLocaleFromTranslation(t)
  const isLivePriceType = !tradePriceType || tradePriceType === 'live'
  const liveBtcPriceFormatted =
    btcPriceForOfferWithState?.state === 'error'
      ? '-'
      : (btcPriceForOfferWithState?.btcPrice?.BTC.toLocaleString(locale, {
          maximumFractionDigits: 0,
        }) ?? '-')

  return (
    <Stack gap="$7">
      <XStack ai="flex-start" jc="space-between" gap="$4">
        <SwitchTradePriceTypeButton
          onPress={() => {
            void Effect.runPromise(
              Effect.gen(function* (_) {
                const selectedTradePriceType = yield* _(
                  showTradePriceTypeDialog()
                )

                if (!selectedTradePriceType) return

                if (selectedTradePriceType === 'your') {
                  setOwnPrice(undefined)
                  const confirmed = yield* _(
                    showGlobalDialog({
                      title: t(
                        'tradeChecklist.calculateAmount.setYourOwnPrice'
                      ),
                      positiveButtonText: t('common.save'),
                      negativeButtonText: t('common.close'),
                      positiveButtonDisabledAtom:
                        ownPriceSaveButtonDisabledAtom,
                      children: (
                        <SetYourOwnPriceDialogContent
                          fiatCurrency={fiatCurrency ?? 'USD'}
                        />
                      ),
                    })
                  )

                  if (confirmed) {
                    yield* _(
                      Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate)
                    )
                    saveYourPrice(fiatCurrency)
                  }
                  return
                }

                void setFormDataBasedOnBtcPriceType(selectedTradePriceType)
              })
            )
          }}
        />
        <CurrentBtcPrice
          disabled={tradePriceType !== 'live'}
          currencyAtom={btcPriceCurrencyAtom}
          customBtcPriceAtom={
            tradePriceType !== 'live' ? tradeBtcPriceAtom : undefined
          }
          postRefreshActions={calculateFiatValueAfterBtcPriceRefresh}
          showLastUpdatedAt={false}
          col="$foregroundSecondary"
          fos={12}
          onPricePress={
            isLivePriceType
              ? () => {
                  setLivePriceDialogVisible(true)
                }
              : undefined
          }
          textAlign="right"
          trailingElement={
            isLivePriceType ? (
              <InfoCircle color={theme.foregroundSecondary.get()} size={16} />
            ) : undefined
          }
        />
      </XStack>
      {tradePriceType === 'custom' && children}
      <Stack gap="$2">
        <Exchange
          btcValue={btcInputValue}
          btcUnit={btcOrSat === 'SAT' ? 'SATS' : 'BTC'}
          onBtcValueChange={(value) => {
            calculateFiatValueOnBtcAmountChange({btcAmount: value})
          }}
          onBtcUnitChange={() => {}}
          onToggleBtcUnit={() => {
            switchBtcOrSatValue()
          }}
          fiatValue={fiatInputValue}
          fiatCurrency={fiatCurrency ?? 'USD'}
          onFiatValueChange={(value) => {
            calculateBtcValueOnFiatAmountChange({fiatAmount: value})
          }}
          onFiatCurrencyPress={() => {
            openChangeCurrency({
              selectedCurrencyCode: fiatCurrency,
              onSave: (currency) => {
                void updateFiatCurrency(currency)
              },
            })
          }}
          locale={locale}
          swapped={amountInputsSwapped}
          onSwapPress={() => {
            setAmountInputsSwapped((previous) => !previous)
          }}
        />
      </Stack>
      <PremiumOrDiscount onPremiumOrDiscountPress={onPremiumOrDiscountPress} />
      <Dialog
        visible={livePriceDialogVisible}
        onClose={() => {
          setLivePriceDialogVisible(false)
        }}
        footer={
          <>
            <Button
              flex={1}
              variant="secondary"
              onPress={() => {
                setLivePriceDialogVisible(false)
                void refreshCurrentBtcPrice()()
              }}
            >
              {t('tradeCalculator.refreshPrice')}
            </Button>
            <Button
              flex={1}
              onPress={() => {
                setLivePriceDialogVisible(false)
              }}
            >
              {t('common.close')}
            </Button>
          </>
        }
      >
        <XStack ai="center" jc="space-between" gap="$4">
          <XStack
            ai="center"
            gap="$2"
            backgroundColor="$navigationBackgroundHighlight"
            br="$2"
            p="$2"
          >
            <AnimatedLiveIndicator color="$accentYellowPrimary" />
            <Typography variant="micro" color="$accentHighlightPrimary">
              {t('tradeCalculator.liveMarketPrice')}
            </Typography>
          </XStack>
          <Typography variant="micro" color="$foregroundSecondary">
            {t('tradeChecklist.calculateAmount.sourceYadio')}
          </Typography>
        </XStack>
        <YStack>
          <Typography
            variant="heading2"
            color="$foregroundPrimary"
            fontWeight="700"
          >
            {t('tradeCalculator.oneBtcEquals')}
          </Typography>
          <Typography
            variant="heading2"
            color="$foregroundPrimary"
            fontWeight="700"
          >
            {`${liveBtcPriceFormatted} ${fiatCurrency ?? 'USD'}`}
          </Typography>
        </YStack>
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {t('tradeCalculator.liveMarketPriceDescription')}
        </Typography>
      </Dialog>
    </Stack>
  )
}

export default TradeCalculator
