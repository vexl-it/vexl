import {
  Button,
  DateSuggestionCard,
  TimeSuggestionCard,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {noop} from '../../shared/noop'
import {Tap} from '../../shared/Tap'
import {meeting, offer} from '../script'
import type {At} from '../tradeDemo'
import {ChecklistPage} from './ChecklistPage'
import {CopyAmountButtons} from './CopyAmountButtons'

const close = [{icon: XmarkCancelClose, onPress: noop}]

/** "Choose the day" from the suggested dates. */
export function PickDateScene({at}: {at: At}): React.JSX.Element {
  return (
    <ChecklistPage title="Choose the day" hideBack rightActions={close}>
      <YStack gap="$7">
        <Tap on={at('youTapDate')}>
          <DateSuggestionCard
            weekday={meeting.weekday}
            dateLabel={meeting.dateLabel}
            slotsCaption="time slots"
            slots={meeting.slots.join(', ')}
            onPress={noop}
          />
        </Tap>
        <Button size="medium" variant="secondary" onPress={noop}>
          Add different date and time
        </Button>
      </YStack>
    </ChecklistPage>
  )
}

/** "Select time" on the chosen day. */
export function PickTimeScene({at}: {at: At}): React.JSX.Element {
  const picked = at('youTapTime')
  return (
    <ChecklistPage
      title="Select time"
      rightActions={close}
      button={{
        text: 'Accept',
        variant: 'secondary',
        disabled: !picked,
        tap: at('youTapTimeAccept'),
      }}
    >
      <YStack gap="$7">
        <Typography
          variant="titlesSmall"
          color="$foregroundPrimary"
          textAlign="center"
          mt="$4"
        >
          {`${meeting.weekday}, ${meeting.dateLabel}`}
        </Typography>
        <YStack gap="$4">
          {pipe(
            meeting.slots,
            Array.map((slot, index) => {
              const selected = picked && index === meeting.slots.length - 1
              return (
                <Tap key={slot} on={selected}>
                  <TimeSuggestionCard
                    label={slot}
                    selected={selected}
                    onPress={noop}
                  />
                </Tap>
              )
            })
          )}
        </YStack>
      </YStack>
    </ChecklistPage>
  )
}

/** "Confirm amount" suggested by the other side. */
export function ConfirmAmountScene({at}: {at: At}): React.JSX.Element {
  return (
    <ChecklistPage
      title="Confirm amount"
      button={{text: 'Accept', tap: at('youTapAmountAccept')}}
    >
      <YStack gap="$7" pt="$4">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          gap="$3"
          p="$5"
        >
          <Typography variant="heading2" color="$foregroundPrimary">
            {`${offer.fiatAmount} CZK`}
          </Typography>
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {`${offer.btcAmount} BTC`}
          </Typography>
          <Button
            size="small"
            variant="secondary"
            alignSelf="stretch"
            onPress={noop}
          >
            Suggest a different amount
          </Button>
        </YStack>
        <CopyAmountButtons />
      </YStack>
    </ChecklistPage>
  )
}
