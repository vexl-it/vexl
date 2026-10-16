import {
  BoltElectric,
  Button,
  Calendar,
  ChecklistCell,
  ChecklistSection,
  ChevronLeft,
  DateTimeSlotsCard,
  EyeShut,
  MoneyBankNotes,
  NavigationBar,
  PinGeolocation,
  Screen,
  Switch,
  TimeSlotChip,
  TimeSlotGroup,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
  type IconProps,
  type NavigationBarAction,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import type {ComponentType, ReactNode} from 'react'
import {noop} from './noop'
import {Tap} from './Tap'
import {useValueAtom} from './useValueAtom'

/** A trade checklist screen: title bar, padded content and one bottom button. */
export function ChecklistPage({
  title,
  hideBack,
  rightActions,
  button,
  children,
}: {
  title: string
  hideBack?: boolean
  rightActions?: NavigationBarAction[]
  button?: {
    text: string
    variant?: 'primary' | 'secondary'
    disabled?: boolean
    tap: boolean
  }
  children: ReactNode
}): React.JSX.Element {
  return (
    <Screen
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={title}
          leftAction={hideBack ? undefined : {icon: ChevronLeft, onPress: noop}}
          rightActions={rightActions}
        />
      }
      footer={
        button ? (
          <Tap on={button.tap}>
            <Button
              variant={button.variant ?? 'primary'}
              disabled={button.disabled}
              onPress={noop}
            >
              {button.text}
            </Button>
          </Tap>
        ) : undefined
      }
    >
      <YStack flex={1} p="$5" overflow="hidden">
        {children}
      </YStack>
    </Screen>
  )
}

/** A checklist item the demo touches. */
export interface HubItem {
  readonly tap: boolean
  /** The cell's subtitle once a change is queued for sending. */
  readonly queued?: string | undefined
}

function HubCell({
  item,
  icon,
  headline,
  subtitle,
}: {
  item: HubItem | undefined
  icon: ComponentType<IconProps>
  headline: string
  subtitle?: string
}): React.JSX.Element {
  return (
    <Tap on={item?.tap ?? false}>
      <ChecklistCell
        state={item?.queued ? 'pending' : 'initial'}
        icon={icon}
        headline={headline}
        subtitle={item?.queued ?? subtitle}
        pressable
      />
    </Tap>
  )
}

/** The trade checklist hub, where changes are collected before sending them. */
export function ChecklistHub({
  dateAndTime,
  location,
  amount,
  tapSend,
}: {
  dateAndTime?: HubItem
  location?: HubItem
  amount?: HubItem
  tapSend: boolean
}): React.JSX.Element {
  const anyQueued = pipe(
    [dateAndTime, location, amount],
    Array.some((item) => item?.queued !== undefined)
  )
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
        <Tap on={tapSend}>
          <Button
            size="large"
            variant="primary"
            disabled={!anyQueued}
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
          <HubCell
            item={dateAndTime}
            icon={Calendar}
            headline="Date and time"
          />
          <HubCell
            item={location}
            icon={PinGeolocation}
            headline="Meeting location"
          />
        </ChecklistSection>
        <ChecklistSection title="Payment details">
          <HubCell
            item={amount}
            icon={MoneyBankNotes}
            headline="Calculate amount"
          />
          <HubCell
            item={undefined}
            icon={BoltElectric}
            headline="Set network"
          />
        </ChecklistSection>
        <ChecklistSection title="Privacy">
          <HubCell
            item={undefined}
            icon={EyeShut}
            headline="Reveal identity"
            subtitle="Nickname, phone number or photo"
          />
        </ChecklistSection>
      </YStack>
    </Screen>
  )
}

const afternoon = ['2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM']
const evening = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM']

/** "Date and time": time slots for one day; `slots` are picked when `picked` turns true at the same index. */
export function TimeOptions({
  weekday,
  dateLabel,
  slots,
  picked,
  saved,
  tapContinue,
}: {
  weekday: string
  dateLabel: string
  slots: readonly string[]
  picked: readonly boolean[]
  saved: boolean
  tapContinue: boolean
}): React.JSX.Element {
  const applyToAllAtom = useValueAtom(false)
  const extraSlots = pipe(
    slots,
    Array.filter(
      (slot) =>
        !Array.contains(afternoon, slot) && !Array.contains(evening, slot)
    )
  )
  const chip = (label: string): React.JSX.Element => {
    const selected = pipe(
      Array.findFirstIndex(slots, (slot) => slot === label),
      Option.flatMap((index) => Array.get(picked, index)),
      Option.getOrElse(() => false)
    )
    return (
      <Tap key={label} on={selected}>
        <TimeSlotChip label={label} selected={selected} onPress={noop} />
      </Tap>
    )
  }
  return (
    <ChecklistPage
      title="Date and time"
      button={{text: 'Continue', disabled: !saved, tap: tapContinue}}
    >
      <YStack gap="$5">
        <Typography variant="description" color="$foregroundSecondary">
          Pick when you are free. Use the toggle below to apply times to all
          days.
        </Typography>
        <DateTimeSlotsCard
          weekday={weekday.toLowerCase()}
          dateLabel={dateLabel}
          expanded={!saved}
          onExpand={noop}
          onCollapse={noop}
          selectedSlots={saved ? Array.join(slots, ', ') : undefined}
          selectedSlotsCaption="time slots"
          expandLabel="Add time slots"
          collapseLabel="Hide time slots"
        >
          <TimeSlotGroup title="Afternoon">
            {pipe(afternoon, Array.appendAll(extraSlots), Array.map(chip))}
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
          <Tap on={saved}>
            <Button size="medium" variant="primary" onPress={noop}>
              Save
            </Button>
          </Tap>
        </DateTimeSlotsCard>
      </YStack>
    </ChecklistPage>
  )
}
