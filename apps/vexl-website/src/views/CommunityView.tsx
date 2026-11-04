'use client'

import {
  ArrowRight,
  BoxProduct,
  Button,
  DiplomaAsset,
  IconBox,
  MegaphoneNotifications,
  Microphone,
  PageSection,
  TextTag,
  Typography,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import Image from 'next/image'
import React, {useState} from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../components/LocaleProvider'
import {SiteLink} from '../components/SiteLink'
import {externalLinks} from '../config/links'
import {type CommunityEvent, type CommunityEvents} from '../content/events'
import {formatDate} from '../formatDate'

const EVENTS_PAGE_SIZE = 5

function EventDate({date}: {readonly date: string}): React.JSX.Element {
  const {locale} = useLocale()
  const formatted = formatDate(locale, date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <Typography
      variant="description"
      color="$foregroundSecondary"
      minWidth={130}
    >
      {formatted}
    </Typography>
  )
}

function EventRow({
  event,
}: {
  readonly event: CommunityEvent
}): React.JSX.Element {
  const theme = useTheme()
  const name = (
    <XStack alignItems="center" gap="$2">
      <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
        {event.name}
      </Typography>
      {event.url ? (
        <ArrowRight size={16} color={theme.foregroundSecondary.get()} />
      ) : null}
    </XStack>
  )
  return (
    <XStack
      alignItems="center"
      gap="$4"
      flexWrap="wrap"
      paddingHorizontal="$5"
      paddingVertical="$4"
      borderRadius="$4"
      backgroundColor="$backgroundSecondary"
    >
      <EventDate date={event.date} />
      <YStack flex={1} minWidth={200}>
        {event.url ? <SiteLink href={event.url}>{name}</SiteLink> : name}
      </YStack>
      <XStack gap="$2" flexWrap="wrap">
        {pipe(
          [event.speakers, event.location, event.time],
          Array.filter((detail): detail is string => detail !== undefined),
          Array.map((detail) => (
            <TextTag key={detail} label={detail} variant="neutral" />
          ))
        )}
      </XStack>
    </XStack>
  )
}

function PastEvents({
  events,
}: {
  readonly events: readonly CommunityEvent[]
}): React.JSX.Element {
  const {t} = useLocale()
  const [visible, setVisible] = useState(EVENTS_PAGE_SIZE)
  return (
    <YStack gap="$3">
      {events.slice(0, visible).map((event) => (
        <EventRow key={`${event.date}-${event.name}`} event={event} />
      ))}
      {visible < events.length ? (
        <XStack justifyContent="center" paddingTop="$3">
          <Button
            variant="link"
            size="medium"
            onPress={() => {
              setVisible((count) => count + EVENTS_PAGE_SIZE)
            }}
          >
            {t.community.showOlder}
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}

const supportItems = [
  {key: 'promo', icon: MegaphoneNotifications, tone: 'red'},
  {key: 'training', icon: DiplomaAsset, tone: 'highlight'},
  {key: 'merch', icon: BoxProduct, tone: 'accent'},
  {key: 'speakers', icon: Microphone, tone: 'green'},
] as const satisfies ReadonlyArray<{
  readonly key: string
  readonly icon: React.ComponentType<IconProps>
  readonly tone: 'red' | 'highlight' | 'accent' | 'green'
}>

function HostEventSection(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()
  const copy = t.community
  return (
    <PageSection
      id="host-event"
      style={{scrollMarginTop: 96}}
      $md={{flexDirection: 'row'}}
    >
      <YStack flex={1} gap="$5" alignItems="flex-start">
        <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
          {copy.host.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.host.text}
        </Typography>
        <SiteLink href={externalLinks.meetupKit}>
          <Button role="none">{copy.host.materials}</Button>
        </SiteLink>
        <SiteLink href={externalLinks.marketingEmail}>
          <Button role="none" variant="secondary" size="medium">
            {copy.host.email}
          </Button>
        </SiteLink>
      </YStack>
      <YStack flex={1} gap="$5">
        <Typography tag="h3" variant="heading3" color="$foregroundPrimary">
          {copy.support.title}
        </Typography>
        <XStack flexWrap="wrap" gap="$5">
          {supportItems.map(({key, icon: Icon, tone}) => (
            <XStack
              key={key}
              alignItems="center"
              gap="$4"
              width="45%"
              minWidth={200}
            >
              <IconBox tone={tone}>
                <Icon size={24} color={theme.foregroundPrimary.get()} />
              </IconBox>
              <Typography variant="paragraphSmall" color="$foregroundPrimary">
                {copy.support[key]}
              </Typography>
            </XStack>
          ))}
        </XStack>
      </YStack>
    </PageSection>
  )
}

export function CommunityView({
  events,
}: {
  readonly events: CommunityEvents
}): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.community

  return (
    <>
      <PageSection alignItems="center">
        <Typography variant="paragraphSmallBold" color="$pinkLight">
          {copy.eyebrow}
        </Typography>
        <Typography
          tag="h1"
          variant="display"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {copy.title}
        </Typography>
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {copy.text}
        </Typography>
        <XStack gap="$3" flexWrap="wrap" justifyContent="center">
          <SiteLink href="#events">
            <Button role="none" size="medium">
              {copy.browseEvents}
            </Button>
          </SiteLink>
          <SiteLink href="#host-event">
            <Button role="none" size="medium" variant="secondary">
              {copy.hostEvent}
            </Button>
          </SiteLink>
        </XStack>
      </PageSection>

      <PageSection id="events" style={{scrollMarginTop: 96}}>
        <YStack gap="$4">
          <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
            {copy.upcomingTitle}
          </Typography>
          {Array.isNonEmptyReadonlyArray(events.upcoming) ? (
            <YStack gap="$3">
              {events.upcoming.map((event) => (
                <EventRow key={`${event.date}-${event.name}`} event={event} />
              ))}
            </YStack>
          ) : (
            <Typography variant="paragraphSmall" color="$foregroundSecondary">
              {copy.noUpcoming}
            </Typography>
          )}
        </YStack>
        <YStack gap="$4">
          <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
            {copy.pastTitle}
          </Typography>
          <PastEvents events={events.past} />
        </YStack>
      </PageSection>

      <HostEventSection />

      <PageSection alignItems="center">
        <Typography
          tag="h2"
          variant="display"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {copy.gallery.title}
        </Typography>
        <Image
          src="/images/community-gallery.webp"
          alt={copy.gallery.alt}
          width={2000}
          height={1050}
          sizes="(min-width: 1200px) 1120px, 100vw"
          style={{width: '100%', height: 'auto'}}
        />
      </PageSection>
    </>
  )
}
