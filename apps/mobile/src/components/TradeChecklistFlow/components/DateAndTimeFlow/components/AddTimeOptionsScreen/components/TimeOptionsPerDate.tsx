import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Button,
  DateTimeSlotsCard,
  Switch,
  TimeSlotChip,
  TimeSlotGroup,
  Typography,
  XStack,
} from '@vexl-next/ui'
import {Array as ArrayE, pipe, Schema} from 'effect'
import {atom, useAtom, useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import React, {useEffect, useMemo, useState} from 'react'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {
  formatDate,
  formatTime,
  type FormattingLocale,
} from '../../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../../utils/localization/formattingLocaleAtom'
import {availableDateTimesAtom, uniqueAvailableDatesAtom} from '../../../atoms'
import {createAvailableDateTimeEntry} from '../../../utils'

interface Props {
  date: UnixMilliseconds
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
}

interface SlotSection {
  title: string
  slots: UnixMilliseconds[]
}

function isSameDay(
  firstDate: UnixMilliseconds,
  secondDate: UnixMilliseconds
): boolean {
  return (
    DateTime.fromMillis(firstDate).toFormat('yyyy-MM-dd') ===
    DateTime.fromMillis(secondDate).toFormat('yyyy-MM-dd')
  )
}

function getDateHeadline(
  date: UnixMilliseconds,
  locale: FormattingLocale
): {
  weekday: string
  label: string
} {
  return {
    weekday: formatDate(date, locale, {weekday: 'long'}).toLowerCase(),
    label: formatDate(date, locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

function getSlotLabel(
  slot: UnixMilliseconds,
  locale: FormattingLocale
): string {
  return formatTime(slot, locale)
}

function createSlotSections(date: UnixMilliseconds): SlotSection[] {
  const dayStart = DateTime.fromMillis(date).startOf('day')
  const now = DateTime.now()
  const allSlots = Array.from({length: 36}, (_, index) =>
    Schema.decodeSync(UnixMilliseconds)(
      dayStart
        .plus({
          hours: 6 + Math.floor(index / 2),
          minutes: index % 2 === 0 ? 0 : 30,
        })
        .toMillis()
    )
  ).filter((slot) => slot > now.toMillis())

  return [
    {
      title: 'Morning',
      slots: allSlots.filter((slot) => DateTime.fromMillis(slot).hour < 12),
    },
    {
      title: 'Afternoon',
      slots: allSlots.filter((slot) => {
        const slotHour = DateTime.fromMillis(slot).hour
        return slotHour >= 12 && slotHour < 18
      }),
    },
    {
      title: 'Evening',
      slots: allSlots.filter((slot) => DateTime.fromMillis(slot).hour >= 18),
    },
  ].filter((section) => section.slots.length > 0)
}

function createReplicatedEntries(
  targetDate: UnixMilliseconds,
  selectedSlots: UnixMilliseconds[]
): AvailableDateTimeOption[] {
  return pipe(
    selectedSlots,
    ArrayE.flatMap((selectedSlot) => {
      const localizedSelectedSlot = DateTime.fromMillis(selectedSlot)
      const nextDateTime = DateTime.fromMillis(targetDate).startOf('day').set({
        hour: localizedSelectedSlot.hour,
        minute: localizedSelectedSlot.minute,
      })

      if (nextDateTime.toMillis() <= DateTime.now().toMillis()) {
        return []
      }

      return [
        createAvailableDateTimeEntry(
          Schema.decodeSync(UnixMilliseconds)(nextDateTime.toMillis())
        ),
      ]
    })
  )
}

function replaceEntriesForDates({
  affectedDates,
  availableDateTimes,
  selectedSlots,
}: {
  affectedDates: UnixMilliseconds[]
  availableDateTimes: AvailableDateTimeOption[]
  selectedSlots: UnixMilliseconds[]
}): AvailableDateTimeOption[] {
  const unchangedEntries = pipe(
    availableDateTimes,
    ArrayE.filter(
      (entry) =>
        !pipe(
          affectedDates,
          ArrayE.some((affectedDate) => isSameDay(entry.date, affectedDate))
        )
    )
  )

  const replicatedEntries = pipe(
    affectedDates,
    ArrayE.flatMap((affectedDate) =>
      createReplicatedEntries(affectedDate, selectedSlots)
    )
  )

  return [...unchangedEntries, ...replicatedEntries].sort(
    (firstEntry, secondEntry) => firstEntry.to - secondEntry.to
  )
}

function TimeOptionsPerDate({
  date,
  expanded,
  onExpand,
  onCollapse,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const [availableDateTimes, setAvailableDateTimes] = useAtom(
    availableDateTimesAtom
  )
  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const applyToAllAtom = useMemo(() => atom(false), [])
  const [applyToAllDates, setApplyToAllDates] = useAtom(applyToAllAtom)
  const [draftSlots, setDraftSlots] = useState<UnixMilliseconds[]>([])

  const savedSlots = useMemo(
    () =>
      pipe(
        availableDateTimes,
        ArrayE.filter((entry) => isSameDay(entry.date, date)),
        ArrayE.map((entry) => entry.to)
      ).sort((firstSlot, secondSlot) => firstSlot - secondSlot),
    [availableDateTimes, date]
  )

  const slotSections = useMemo(() => createSlotSections(date), [date])
  const {weekday, label} = useMemo(
    () => getDateHeadline(date, locale),
    [date, locale]
  )

  useEffect(() => {
    if (!expanded) {
      setApplyToAllDates(false)
    } else {
      setDraftSlots(savedSlots)
    }
  }, [expanded, savedSlots, setApplyToAllDates])

  const selectedLabels = useMemo(
    () =>
      pipe(
        savedSlots,
        ArrayE.map((slot) => getSlotLabel(slot, locale))
      ),
    [locale, savedSlots]
  )

  const onSlotPress = (slot: UnixMilliseconds): void => {
    setDraftSlots((previousSlots) => {
      const nextDraftSlots = previousSlots.includes(slot)
        ? previousSlots.filter((previousSlot) => previousSlot !== slot)
        : [...previousSlots, slot].sort(
            (firstSlot, secondSlot) => firstSlot - secondSlot
          )

      setAvailableDateTimes((previousAvailableDateTimes) =>
        replaceEntriesForDates({
          affectedDates: [date],
          availableDateTimes: previousAvailableDateTimes,
          selectedSlots: nextDraftSlots,
        })
      )

      return nextDraftSlots
    })
  }

  const onSavePress = (): void => {
    const affectedDates = applyToAllDates ? uniqueAvailableDates : [date]
    setAvailableDateTimes((previousAvailableDateTimes) =>
      replaceEntriesForDates({
        affectedDates,
        availableDateTimes: previousAvailableDateTimes,
        selectedSlots: draftSlots,
      })
    )
    onCollapse()
  }

  return (
    <DateTimeSlotsCard
      weekday={weekday}
      dateLabel={label}
      expanded={expanded}
      onExpand={onExpand}
      onCollapse={onCollapse}
      selectedSlots={
        selectedLabels.length > 0 ? selectedLabels.join(', ') : undefined
      }
      selectedSlotsCaption="time slots"
      expandLabel="Add time slots"
      collapseLabel="Hide time slots"
    >
      {pipe(
        slotSections,
        ArrayE.map((section) => (
          <TimeSlotGroup key={section.title} title={section.title}>
            {pipe(
              section.slots,
              ArrayE.map((slot) => (
                <TimeSlotChip
                  key={slot}
                  label={getSlotLabel(slot, locale)}
                  selected={draftSlots.includes(slot)}
                  onPress={() => {
                    onSlotPress(slot)
                  }}
                />
              ))
            )}
          </TimeSlotGroup>
        ))
      )}

      <XStack alignItems="center" justifyContent="space-between" gap="$4">
        <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
          Apply to all dates
        </Typography>
        <Switch valueAtom={applyToAllAtom} />
      </XStack>

      <Button size="medium" variant="primary" onPress={onSavePress}>
        {t('common.save')}
      </Button>
    </DateTimeSlotsCard>
  )
}

export default TimeOptionsPerDate
