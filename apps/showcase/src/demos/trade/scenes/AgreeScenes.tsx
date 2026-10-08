import {
  BoltElectric,
  BtcPriceLabel,
  Button,
  Calendar,
  ChecklistCell,
  ChecklistSection,
  DateTimeSlotsCard,
  Exchange,
  EyeShut,
  InfoCircle,
  MoneyBankNotes,
  NavigationBar,
  PinGeolocation,
  Screen,
  Switch,
  TimeSlotChip,
  TimeSlotGroup,
  TradePriceTypeButton,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {Tap} from '../../shared/Tap'
import {useValueAtom} from '../../shared/useValueAtom'
import {meeting, offer, typing} from '../script'
import type {At} from '../tradeDemo'
import {ChecklistPage} from './ChecklistPage'

/** The trade checklist hub, where changes are collected before sending them. */
export function ChecklistHubScene({at}: {at: At}): React.JSX.Element {
  const dateQueued = at('dateQueued')
  const amountQueued = at('amountQueued')
  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          rightActions={[{icon: XmarkCancelClose, onPress: noop}]}
        />
      }
      footer={
        <Tap on={at('themTapChecklistSend')}>
          <Button
            size="large"
            variant="primary"
            disabled={!dateQueued}
            onPress={noop}
          >
            Send
          </Button>
        </Tap>
      }
    >
      <YStack gap="$6" pt="$2">
        <YStack gap="$3">
          <Typography variant="heading3" color="$foregroundPrimary">
            Trade checklist
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            Agree on key trade details to avoid confusion later. Everything is
            optional.
          </Typography>
        </YStack>
        <ChecklistSection title="Meeting details">
          <Tap on={at('themTapDateAndTime')}>
            <ChecklistCell
              state={dateQueued ? 'pending' : 'initial'}
              icon={Calendar}
              headline="Date and time"
              subtitle={
                dateQueued
                  ? `You added ${meeting.slots.length} time options`
                  : undefined
              }
              pressable
            />
          </Tap>
          <ChecklistCell
            state="initial"
            icon={PinGeolocation}
            headline="Meeting location"
            pressable
          />
        </ChecklistSection>
        <ChecklistSection title="Payment details">
          <Tap on={at('themTapAmount')}>
            <ChecklistCell
              state={amountQueued ? 'pending' : 'initial'}
              icon={MoneyBankNotes}
              headline="Calculate amount"
              subtitle={amountQueued ? `${offer.btcAmount} BTC` : undefined}
              pressable
            />
          </Tap>
          <ChecklistCell
            state="initial"
            icon={BoltElectric}
            headline="Set network"
            pressable
          />
        </ChecklistSection>
        <ChecklistSection title="Privacy">
          <ChecklistCell
            state="initial"
            icon={EyeShut}
            headline="Reveal identity"
            subtitle="Nickname, phone number or photo"
            pressable
          />
        </ChecklistSection>
      </YStack>
    </Screen>
  )
}

const afternoon = ['2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM']
const evening = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM']

/** "Date and time": time slots for the suggested day. */
export function TimeOptionsScene({at}: {at: At}): React.JSX.Element {
  const applyToAllAtom = useValueAtom(false)
  const picked = [at('themTapSlot1'), at('themTapSlot2')]
  const saved = at('themTapSlotsSave')
  const chip = (label: string): React.JSX.Element => {
    const index = meeting.slots.indexOf(label)
    return (
      <Tap key={label} on={picked[index] ?? false}>
        <TimeSlotChip
          label={label}
          selected={picked[index] ?? false}
          onPress={noop}
        />
      </Tap>
    )
  }
  return (
    <ChecklistPage
      title="Date and time"
      button={{
        text: 'Continue',
        disabled: !saved,
        tap: at('themTapTimesContinue'),
      }}
    >
      <YStack gap="$5">
        <Typography variant="description" color="$foregroundSecondary">
          Pick when you are free. Use the toggle below to apply times to all
          days.
        </Typography>
        <DateTimeSlotsCard
          weekday={meeting.weekday.toLowerCase()}
          dateLabel={meeting.dateLabel}
          expanded={!saved}
          onExpand={noop}
          onCollapse={noop}
          selectedSlots={saved ? meeting.slots.join(', ') : undefined}
          selectedSlotsCaption="time slots"
          expandLabel="Add time slots"
          collapseLabel="Hide time slots"
        >
          <TimeSlotGroup title="Afternoon">
            {pipe(afternoon, Array.appendAll(meeting.slots), Array.map(chip))}
          </TimeSlotGroup>
          <TimeSlotGroup title="Evening">
            {pipe(evening, Array.map(chip))}
          </TimeSlotGroup>
          <XStack justifyContent="space-between" alignItems="center">
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              Apply to all dates
            </Typography>
            <Switch valueAtom={applyToAllAtom} />
          </XStack>
          <Tap on={at('themTapSlotsSave')}>
            <Button size="medium" variant="primary" onPress={noop}>
              Save
            </Button>
          </Tap>
        </DateTimeSlotsCard>
      </YStack>
    </ChecklistPage>
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
