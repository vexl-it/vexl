'use client'

import {
  BoxProduct,
  Button,
  DiplomaAsset,
  EventCard,
  IconBox,
  MegaphoneNotifications,
  Microphone,
  PageSection,
  Typography,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../components/LocaleProvider'
import {Photo} from '../components/Photo'
import {SiteLink} from '../components/SiteLink'
import {externalLinks} from '../config/links'
import {type CommunityEvent, type CommunityEvents} from '../content/events'
import {formatDate} from '../formatDate'

const EVENTS_PAGE_SIZE = 8

function EventItem({
  event,
}: {
  readonly event: CommunityEvent
}): React.JSX.Element {
  const {locale} = useLocale()
  const card = (
    <EventCard
      title={event.name}
      details={pipe(
        [
          formatDate(locale, event.date, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          event.location,
          event.speakers,
        ],
        Array.filter((detail): detail is string => detail !== undefined)
      )}
    />
  )
  return (
    <YStack width="100%" $md={{width: 'calc(50% - 6px)'}}>
      {event.url ? <SiteLink href={event.url}>{card}</SiteLink> : card}
    </YStack>
  )
}

function EventList({
  events,
}: {
  readonly events: readonly CommunityEvent[]
}): React.JSX.Element {
  return (
    <XStack flexWrap="wrap" gap="$3">
      {events.map((event) => (
        <EventItem key={`${event.date}-${event.name}`} event={event} />
      ))}
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
      <EventList events={events.slice(0, visible)} />
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
        <XStack gap="$3" flexWrap="wrap">
          <SiteLink href={externalLinks.meetupKit}>
            <Button role="none" size="medium">
              {copy.host.materials}
            </Button>
          </SiteLink>
          <SiteLink href={externalLinks.marketingEmail}>
            <Button role="none" variant="tertiary" size="medium">
              {copy.host.email}
            </Button>
          </SiteLink>
        </XStack>
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
        <Typography variant="paragraphSmallBold" color="$accentYellowPrimary">
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
          maxWidth={600}
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
            <Button role="none" size="medium" variant="tertiary">
              {copy.hostEvent}
            </Button>
          </SiteLink>
        </XStack>
        <XStack width="100%" gap="$4" height={240} $md={{height: 420}}>
          <Photo
            photo="signCowboy"
            alt={copy.photos.signCowboy}
            sizes="(min-width: 1200px) 520px, 50vw"
            flex={1.6}
          />
          <Photo
            photo="wave"
            alt={copy.photos.wave}
            sizes="(min-width: 1200px) 280px, 25vw"
            flex={0.8}
          />
          <YStack display="none" $md={{display: 'flex'}} flex={1.2}>
            <Photo
              photo="conversation"
              alt={copy.photos.conversation}
              sizes="(min-width: 1200px) 380px, 30vw"
              flex={1}
            />
          </YStack>
        </XStack>
      </PageSection>

      <PageSection id="events" style={{scrollMarginTop: 96}}>
        {Array.isNonEmptyReadonlyArray(events.upcoming) ? (
          <YStack gap="$5">
            <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
              {copy.upcomingTitle}
            </Typography>
            <EventList events={events.upcoming} />
          </YStack>
        ) : null}
        <YStack gap="$5">
          <YStack gap="$3">
            <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
              {copy.pastTitle}
            </Typography>
            {Array.isNonEmptyReadonlyArray(events.upcoming) ? null : (
              <Typography variant="paragraph" color="$foregroundSecondary">
                {copy.noUpcoming}
              </Typography>
            )}
          </YStack>
          <PastEvents events={events.past} />
        </YStack>
      </PageSection>

      <HostEventSection />

      <PageSection>
        <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
          {copy.gallery.title}
        </Typography>
        <XStack gap="$4" height={220} $md={{height: 360}}>
          <Photo
            photo="crowd"
            alt={copy.photos.crowd}
            sizes="(min-width: 1200px) 560px, 50vw"
            flex={1}
          />
          <Photo
            photo="signMerch"
            alt={copy.photos.signMerch}
            sizes="(min-width: 1200px) 560px, 50vw"
            flex={1}
          />
        </XStack>
        <XStack gap="$4" height={220} $md={{height: 360}}>
          <Photo
            photo="flyers"
            alt={copy.photos.flyers}
            sizes="(min-width: 1200px) 370px, 33vw"
            flex={1}
          />
          <Photo
            photo="wristband"
            alt={copy.photos.wristband}
            sizes="(min-width: 1200px) 370px, 33vw"
            flex={1}
          />
          <YStack display="none" $md={{display: 'flex'}} flex={1}>
            <Photo
              photo="teamBacks"
              alt={copy.photos.teamBacks}
              sizes="(min-width: 1200px) 370px, 33vw"
              flex={1}
            />
          </YStack>
        </XStack>
      </PageSection>
    </>
  )
}
