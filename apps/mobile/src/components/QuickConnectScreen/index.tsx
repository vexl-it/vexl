import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {QuickConnectAmount} from '@vexl-next/domain/src/general/quickOffers'
import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  SegmentedPicker,
  TextField,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {normalizeLocalizedDecimalInput} from '@vexl-next/ui/src/components/normalizeLocalizedDecimalInput'
import {Array, Effect, Option, Schema} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  quickConnectCandidatesAtom,
  sendQuickConnectPingActionAtom,
} from '../../state/quickConnect/atoms'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {defaultCurrencyAtom} from '../../utils/preferences'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {showErrorAlert} from '../ErrorAlert'

type Props = RootStackScreenProps<'QuickConnect'>
type AmountUnit = 'BTC' | 'FIAT'

const decodeAmount = Schema.decodeUnknownOption(QuickConnectAmount)

function parseAmount({
  text,
  unit,
  currency,
  locale,
}: {
  text: string
  unit: AmountUnit
  currency: CurrencyCode
  locale: string
}): Option.Option<QuickConnectAmount> {
  const value = Number(normalizeLocalizedDecimalInput(text, locale))
  return decodeAmount(
    unit === 'BTC'
      ? {_tag: 'BtcAmount', btc: value}
      : {_tag: 'FiatAmount', amount: value, currency}
  )
}

function QuickConnectScreen({
  route: {
    params: {iWant},
  },
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const locale = useAtomValue(formattingLocaleAtom)
  const currency = useAtomValue(defaultCurrencyAtom)
  const hasCandidates = Array.isNonEmptyReadonlyArray(
    useAtomValue(quickConnectCandidatesAtom)[iWant]
  )
  const sendPing = useSetAtom(sendQuickConnectPingActionAtom)
  const [amountTextAtom] = useState(() => atom(''))
  const amountText = useAtomValue(amountTextAtom)
  const [unit, setUnit] = useState<AmountUnit>('FIAT')

  const isAmountEmpty = amountText.trim() === ''
  const amount = isAmountEmpty
    ? Option.none()
    : parseAmount({text: amountText, unit, currency, locale})
  const canSend = isAmountEmpty || Option.isSome(amount)

  const handleSend = (): void => {
    void Effect.runPromise(
      sendPing({iWant, amount: Option.getOrUndefined(amount)}).pipe(
        Effect.match({
          onSuccess: safeGoBack,
          onFailure: (error) => {
            // The marketplace shows the countdown.
            if (error._tag === 'QuickConnectCooldownError') {
              safeGoBack()
              return
            }
            showErrorAlert({
              title: toCommonErrorMessage(error, t) ?? t('common.unknownError'),
              error,
            })
          },
        })
      )
    )
  }

  const navigationBar = (
    <NavigationBar
      style="back"
      title={
        iWant === 'BUY' ? t('offerForm.buyBitcoin') : t('offerForm.sellBitcoin')
      }
      leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
    />
  )

  if (!hasCandidates) {
    return (
      <Screen
        navigationBar={navigationBar}
        footer={
          <Button
            variant="primary"
            onPress={() => {
              navigation.replace('CRUDOfferFlow')
            }}
          >
            {t('common.createOffer')}
          </Button>
        }
      >
        <YStack gap="$3">
          <Typography variant="heading3" color="$foregroundPrimary">
            {iWant === 'BUY'
              ? t('quickConnect.noMatch.buy')
              : t('quickConnect.noMatch.sell')}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {t('quickConnect.createOfferHint')}
          </Typography>
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={navigationBar}
      footer={
        <Button
          variant={canSend ? 'primary' : 'disabled'}
          disabled={!canSend}
          onPress={handleSend}
        >
          {t('quickConnect.send')}
        </Button>
      }
    >
      <YStack gap="$6">
        <Typography variant="description" color="$foregroundSecondary">
          {iWant === 'BUY'
            ? t('quickConnect.screen.description.buy')
            : t('quickConnect.screen.description.sell')}
        </Typography>
        <YStack gap="$3">
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {t('quickConnect.amount.label')}
          </Typography>
          <SegmentedPicker
            tabs={[
              {label: currency, value: 'FIAT'},
              {label: 'BTC', value: 'BTC'},
            ]}
            activeTab={unit}
            onTabPress={setUnit}
          />
          <TextField
            valueAtom={amountTextAtom}
            placeholder="0"
            keyboardType="decimal-pad"
            showClear
          />
        </YStack>
      </YStack>
    </Screen>
  )
}

export default QuickConnectScreen
