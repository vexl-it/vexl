import {
  BtcPriceLabel,
  Exchange,
  InfoCircle,
  Switch,
  TradePriceTypeButton,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {ChecklistHub, ChecklistPage, TimeOptions} from '../../shared/checklist'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {useValueAtom} from '../../shared/useValueAtom'
import {meeting, offer, typing} from '../script'
import type {At} from '../tradeDemo'

/** The trade checklist hub, where changes are collected before sending them. */
export function ChecklistHubScene({at}: {at: At}): React.JSX.Element {
  return (
    <ChecklistHub
      dateAndTime={{
        tap: at('themTapDateAndTime'),
        queued: at('dateQueued')
          ? `You added ${meeting.slots.length} time options`
          : undefined,
      }}
      amount={{
        tap: at('themTapAmount'),
        queued: at('amountQueued') ? `${offer.btcAmount} BTC` : undefined,
      }}
      tapSend={at('themTapChecklistSend')}
    />
  )
}

/** "Date and time": time slots for the suggested day. */
export function TimeOptionsScene({at}: {at: At}): React.JSX.Element {
  return (
    <TimeOptions
      weekday={meeting.weekday}
      dateLabel={meeting.dateLabel}
      slots={meeting.slots}
      picked={[at('themTapSlot1'), at('themTapSlot2')]}
      saved={at('themTapSlotsSave')}
      tapContinue={at('themTapTimesContinue')}
    />
  )
}

const btcFor = (fiat: string): string =>
  fiat === '' ? '' : (Number(fiat) / offer.btcPriceCzk).toFixed(8)

/** "Suggest amount": the trade calculator at the live price. */
export function CalculateAmountScene({
  at,
  playhead,
}: {
  at: At
  playhead: number
}): React.JSX.Element {
  const theme = useTheme()
  const premiumAtom = useValueAtom(false)
  const fiat = typedAt(typing.fiat, playhead)
  return (
    <ChecklistPage
      title="Suggest amount"
      button={{text: 'Save', tap: at('themTapAmountSave')}}
    >
      <YStack gap="$7">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
          <TradePriceTypeButton priceType="live" label="Live market price" />
          <BtcPriceLabel
            priceLabel={`1 BTC = ${offer.btcPrice} CZK`}
            col="$foregroundSecondary"
            fos={12}
            textAlign="right"
            trailingElement={
              <InfoCircle size={16} color={theme.foregroundSecondary.get()} />
            }
          />
        </XStack>
        <Exchange
          btcValue={btcFor(fiat)}
          btcUnit="BTC"
          onBtcUnitChange={noop}
          fiatValue={fiat}
          fiatCurrency="CZK"
          onFiatValueChange={noop}
          onFiatCurrencyPress={noop}
          swapped
          locale="cs-CZ"
        />
        <XStack justifyContent="space-between" alignItems="center">
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            Premium or discount
          </Typography>
          <Switch valueAtom={premiumAtom} />
        </XStack>
      </YStack>
    </ChecklistPage>
  )
}
