import {FlashList} from '@shopify/flash-list'
import {type Event} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Banner,
  CopyField,
  EventCard,
  type EventCardAttendee,
  LoadErrorState,
  Stack,
  Typography,
} from '@vexl-next/ui'
import dayjs from 'dayjs'
import {Array, Effect, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {Linking} from 'react-native'
import {getTokens} from 'tamagui'
import {copyToClipboardWithToastActionAtom} from '../../../../../../utils/copyToClipboardWithToastActionAtom'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../../../../GlobalDialog'
import {
  createEventActionAtom,
  eventsStateAtom,
  loadEventsActionAtom,
  pastEventsAtom,
  upcomingEventsAtom,
} from './state'

const DATE_FORMAT = 'ddd, MMM D'
const DATE_FORMAT_YEAR = 'ddd, MMM D YYYY'
const TIME_FORMAT = 'HH:mm'
const BULLET = '•'
const spaceTokens = getTokens().space

type EventListItem =
  | {
      readonly type: 'sectionTitle'
      readonly id: string
      readonly title: string
    }
  | {
      readonly type: 'event'
      readonly event: Event
      readonly state: 'upcoming' | 'past'
    }
  | {
      readonly type: 'contactBanner'
      readonly id: string
    }
  | {
      readonly type: 'emptyPast'
      readonly id: string
      readonly title: string
    }

function formatEventDate(event: Event): string {
  const startDate = dayjs(event.startDate)
  const dateFormat = !startDate.isSame(dayjs(), 'year')
    ? DATE_FORMAT_YEAR
    : DATE_FORMAT
  const formattedStartDate = startDate.format(dateFormat)

  return Option.match(event.endDate, {
    onNone: () =>
      `${formattedStartDate} ${BULLET} ${startDate.format(TIME_FORMAT)}`,
    onSome: (endDate) => {
      const formattedEndDate = dayjs(endDate)

      if (formattedEndDate.isSame(startDate, 'day')) {
        return `${formattedStartDate} ${BULLET} ${startDate.format(TIME_FORMAT)}-${formattedEndDate.format(TIME_FORMAT)}`
      }

      return `${formattedStartDate} - ${formattedEndDate.format(DATE_FORMAT)}`
    },
  })
}

function toEventCardAttendee(
  speaker: Event['speakers'][number]
): EventCardAttendee {
  return Option.match(speaker.imageUrl, {
    onNone: () => ({
      id: speaker.name,
      name: speaker.name,
    }),
    onSome: (uri) => ({
      id: speaker.name,
      name: speaker.name,
      avatarSource: {uri},
    }),
  })
}

function MarketingEmailDialogContent(): React.JSX.Element {
  const {t} = useTranslation()
  const copyToClipboard = useSetAtom(copyToClipboardWithToastActionAtom)
  const marketingEmail = t('common.marketingEmailAddress')

  return (
    <CopyField
      backgroundColor="$backgroundPrimary"
      value={marketingEmail}
      onCopy={() => {
        copyToClipboard(marketingEmail)
      }}
    />
  )
}

const EventItem = React.memo(function EventItem({
  event,
  state,
}: {
  readonly event: Event
  readonly state: 'upcoming' | 'past'
}): React.JSX.Element {
  const details = useMemo(() => [formatEventDate(event), event.venue], [event])
  const attendees = useMemo(
    () => pipe(event.speakers, Array.map(toEventCardAttendee)),
    [event.speakers]
  )
  const handlePress = useCallback(() => {
    void Linking.openURL(event.link)
  }, [event.link])

  return (
    <EventCard
      title={event.name}
      details={details}
      attendees={attendees}
      state={state}
      onPress={handlePress}
    />
  )
})

function Separator(): React.JSX.Element {
  return <Stack height="$6" />
}

function keyExtractor(item: EventListItem): string {
  switch (item.type) {
    case 'sectionTitle':
    case 'contactBanner':
    case 'emptyPast':
      return item.id
    case 'event':
      return item.event.id
  }
}

function EventsScreen(): React.JSX.Element {
  const {t} = useTranslation()
  const showDialog = useSetAtom(globalDialogAtom)
  const loadEvents = useSetAtom(loadEventsActionAtom)
  const createEvent = useSetAtom(createEventActionAtom)
  const {data, error, loading} = useAtomValue(eventsStateAtom)
  const upcomingEvents = useAtomValue(upcomingEventsAtom)
  const pastEvents = useAtomValue(pastEventsAtom)

  const handleContactPress = useCallback(() => {
    void Effect.runPromise(
      Effect.gen(function* (_) {
        const confirmed = yield* _(
          showDialog({
            title: t('events.contactUs'),
            subtitle: t('events.contactUsSubtitle'),
            positiveButtonText: t('account.openMailApp'),
            negativeButtonText: t('common.close'),
            children: <MarketingEmailDialogContent />,
          })
        )

        if (confirmed) {
          createEvent()
        }
      })
    )
  }, [createEvent, showDialog, t])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const listData = useMemo((): readonly EventListItem[] => {
    if (Option.isNone(data)) return []

    const upcomingItems = pipe(
      upcomingEvents,
      Array.map(
        (event): EventListItem => ({
          type: 'event',
          event,
          state: 'upcoming',
        })
      )
    )

    const pastItems: readonly EventListItem[] = Array.isNonEmptyReadonlyArray(
      pastEvents
    )
      ? pipe(
          pastEvents,
          Array.map(
            (event): EventListItem => ({
              type: 'event',
              event,
              state: 'past',
            })
          )
        )
      : [
          {
            type: 'emptyPast',
            id: 'emptyPast',
            title: t('events.noEvents'),
          },
        ]

    return [
      {
        type: 'sectionTitle',
        id: 'upcomingTitle',
        title: t('events.upcoming'),
      },
      ...upcomingItems,
      {
        type: 'contactBanner',
        id: 'contactBanner',
      },
      {
        type: 'sectionTitle',
        id: 'pastTitle',
        title: t('events.past'),
      },
      ...pastItems,
    ]
  }, [data, pastEvents, t, upcomingEvents])

  const renderItem = useCallback(
    ({item}: {readonly item: EventListItem}) => {
      switch (item.type) {
        case 'sectionTitle':
          return (
            <Typography color="$foregroundPrimary" variant="titlesSmall">
              {item.title}
            </Typography>
          )
        case 'event':
          return <EventItem event={item.event} state={item.state} />
        case 'contactBanner':
          return (
            <Banner
              color="pink"
              title={t('events.shareYourEvent')}
              description={t('events.organizingMeetup')}
              primaryButton={{
                label: t('events.contactUs'),
                onPress: handleContactPress,
              }}
            />
          )
        case 'emptyPast':
          return (
            <Typography color="$foregroundSecondary" variant="description">
              {item.title}
            </Typography>
          )
      }
    },
    [handleContactPress, t]
  )

  if (Option.isNone(data)) {
    return (
      <LoadErrorState
        paddingHorizontal="$5"
        loading={loading}
        errorMessage={
          Option.isSome(error) ? t('events.errorLoadingEvents') : undefined
        }
        retryLabel={t('common.tryAgain')}
        onRetry={() => {
          void loadEvents()
        }}
      />
    )
  }

  return (
    <FlashList
      data={listData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 24,
        paddingHorizontal: spaceTokens.$5.val,
        paddingTop: spaceTokens.$6.val,
      }}
    />
  )
}

export default EventsScreen
