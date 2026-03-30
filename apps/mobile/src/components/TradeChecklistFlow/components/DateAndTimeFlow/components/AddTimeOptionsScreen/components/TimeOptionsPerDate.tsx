import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Button, lightTheme, Switch, tokens, Typography} from '@vexl-next/ui'
import {Array as ArrayE, pipe, Schema} from 'effect'
import {atom, useAtom, useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import React, {useEffect, useMemo, useState} from 'react'
import {Animated, Easing, TouchableOpacity} from 'react-native'
import {Stack, XStack, YStack} from 'tamagui'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
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

function getDateHeadline(date: UnixMilliseconds): {
  weekday: string
  label: string
} {
  const localizedDate = DateTime.fromMillis(date).setLocale(getCurrentLocale())

  return {
    weekday: localizedDate.toFormat('cccc').toLowerCase(),
    label: localizedDate.toFormat('LLL d, yyyy'),
  }
}

function getSlotLabel(slot: UnixMilliseconds): string {
  return DateTime.fromMillis(slot)
    .setLocale(getCurrentLocale())
    .toLocaleString(DateTime.TIME_SIMPLE)
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

function TimeSlotChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}): React.ReactElement {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Stack
        minWidth={72}
        paddingHorizontal={tokens.space[5].val}
        paddingVertical={tokens.space[4].val}
        borderRadius={tokens.radius[3].val}
        backgroundColor={
          selected
            ? lightTheme.accentYellowPrimary
            : lightTheme.backgroundTertiary
        }
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="paragraphSmall"
          color={selected ? '$black100' : '$foregroundSecondary'}
        >
          {label}
        </Typography>
      </Stack>
    </TouchableOpacity>
  )
}

function TimeOptionsPerDate({
  date,
  expanded,
  onExpand,
  onCollapse,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [availableDateTimes, setAvailableDateTimes] = useAtom(
    availableDateTimesAtom
  )
  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const applyToAllAtom = useMemo(() => atom(false), [])
  const [applyToAllDates, setApplyToAllDates] = useAtom(applyToAllAtom)
  const [draftSlots, setDraftSlots] = useState<UnixMilliseconds[]>([])
  const [shouldRenderExpandedContent, setShouldRenderExpandedContent] =
    useState(expanded)
  const [expandedContentHeight, setExpandedContentHeight] = useState(1)
  const animationProgress = React.useRef(
    new Animated.Value(expanded ? 1 : 0)
  ).current

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
  const {weekday, label} = useMemo(() => getDateHeadline(date), [date])

  useEffect(() => {
    if (!expanded) {
      setApplyToAllDates(false)
    } else {
      setDraftSlots(savedSlots)
    }
  }, [expanded, savedSlots, setApplyToAllDates])

  useEffect(() => {
    if (expanded) {
      setShouldRenderExpandedContent(true)
    }

    Animated.timing(animationProgress, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished && !expanded) {
        setShouldRenderExpandedContent(false)
      }
    })
  }, [animationProgress, expanded])

  const selectedLabels = useMemo(
    () =>
      pipe(
        savedSlots,
        ArrayE.map((slot) => getSlotLabel(slot))
      ),
    [savedSlots]
  )

  const onSlotPress = (slot: UnixMilliseconds): void => {
    setDraftSlots((previousSlots) =>
      previousSlots.includes(slot)
        ? previousSlots.filter((previousSlot) => previousSlot !== slot)
        : [...previousSlots, slot].sort(
            (firstSlot, secondSlot) => firstSlot - secondSlot
          )
    )
  }

  const onSavePress = (): void => {
    const affectedDates = applyToAllDates ? uniqueAvailableDates : [date]

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
        createReplicatedEntries(affectedDate, draftSlots)
      )
    )

    setAvailableDateTimes(
      [...unchangedEntries, ...replicatedEntries].sort(
        (firstEntry, secondEntry) => firstEntry.to - secondEntry.to
      )
    )
    onCollapse()
  }

  const animatedExpandedStyle = {
    maxHeight: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, expandedContentHeight],
    }),
    opacity: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: animationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
    overflow: 'hidden' as const,
  }

  return (
    <Stack
      backgroundColor="$backgroundSecondary"
      borderRadius={tokens.radius[5].val}
      paddingHorizontal={tokens.space[4].val}
      paddingVertical={tokens.space[4].val}
      gap={tokens.space[4].val}
    >
      <TouchableOpacity
        onPress={expanded ? undefined : onExpand}
        activeOpacity={expanded ? 1 : 0.85}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <YStack gap="$3" flex={1}>
            <Typography variant="micro" color="$foregroundSecondary">
              {weekday}
            </Typography>
            <Typography variant="paragraphSmall" color="$foregroundPrimary">
              {label}
            </Typography>
          </YStack>
          {selectedLabels.length > 0 && !expanded ? (
            <YStack alignItems="flex-end" gap="$2" maxWidth="45%">
              <Typography variant="micro" color="$foregroundSecondary">
                time slots
              </Typography>
              <Typography
                variant="descriptionBold"
                color="$accentHighlightSecondary"
                textAlign="right"
              >
                {selectedLabels.join(', ')}
              </Typography>
            </YStack>
          ) : (
            <TouchableOpacity
              onPress={expanded ? onCollapse : onExpand}
              activeOpacity={0.85}
            >
              <Typography
                variant="description"
                color="$accentHighlightSecondary"
              >
                {expanded ? 'Hide time slots' : 'Add time slots'}
              </Typography>
            </TouchableOpacity>
          )}
        </XStack>
      </TouchableOpacity>

      {shouldRenderExpandedContent ? (
        <Animated.View style={animatedExpandedStyle}>
          <Stack
            gap={tokens.space[5].val}
            paddingTop={tokens.space[5].val}
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height)
              if (nextHeight !== expandedContentHeight) {
                setExpandedContentHeight(nextHeight)
              }
            }}
          >
            {pipe(
              slotSections,
              ArrayE.map((section) => (
                <YStack key={section.title} gap="$3" mb="$3">
                  <Typography
                    variant="paragraphSmall"
                    color="$foregroundPrimary"
                  >
                    {section.title}
                  </Typography>
                  <XStack
                    flexWrap="wrap"
                    gap={tokens.space[3].val}
                    rowGap={tokens.space[3].val}
                  >
                    {pipe(
                      section.slots,
                      ArrayE.map((slot) => (
                        <TimeSlotChip
                          key={slot}
                          label={getSlotLabel(slot)}
                          selected={draftSlots.includes(slot)}
                          onPress={() => {
                            onSlotPress(slot)
                          }}
                        />
                      ))
                    )}
                  </XStack>
                </YStack>
              ))
            )}

            <XStack alignItems="center" justifyContent="space-between" gap="$4">
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
              >
                Apply to all dates
              </Typography>
              <Switch valueAtom={applyToAllAtom} />
            </XStack>

            <Button size="medium" variant="primary" onPress={onSavePress}>
              {t('common.save')}
            </Button>
          </Stack>
        </Animated.View>
      ) : null}
    </Stack>
  )
}

export default TimeOptionsPerDate
