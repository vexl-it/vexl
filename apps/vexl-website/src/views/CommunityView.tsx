'use client'

import {
  Button,
  EventCard,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'
import {Eyebrow} from '../components/Eyebrow'
import {useLocale} from '../components/LocaleProvider'
import {Photo} from '../components/Photo'
import {SiteLink} from '../components/SiteLink'
import {externalLinks} from '../config/links'
import {type CommunityEvent, type CommunityEvents} from '../content/events'
import {formatDate} from '../formatDate'
import {formatMessage} from '../i18n/locales'

const EVENTS_PAGE_SIZE = 8

function EventItem({
  event,
}: {
  readonly event: CommunityEvent
}): React.JSX.Element {
  const {t, locale} = useLocale()
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
          event.speakers &&
            formatMessage(t.community.speakers, {names: event.speakers}),
        ],
        Array.filter((detail): detail is string => Boolean(detail))
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

function HostEventSection(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.community.host
  return (
    <PageSection id="host-event" style={{scrollMarginTop: 96}}>
      <YStack
        gap="$7"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        $md={{flexDirection: 'row', alignItems: 'center', padding: '$10'}}
      >
        <YStack gap="$5" alignItems="flex-start" $md={{flex: 1, flexBasis: 0}}>
          <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
            {copy.title}
          </Typography>
          <Typography variant="paragraph" color="$foregroundSecondary">
            {copy.text}
          </Typography>
          <XStack gap="$3" flexWrap="wrap" alignItems="center">
            <SiteLink href={externalLinks.meetupKit}>
              <Button role="none" size="medium">
                {copy.materials}
              </Button>
            </SiteLink>
            <SiteLink href={externalLinks.marketingEmail}>
              <Button role="none" size="medium" variant="secondary">
                {copy.email}
              </Button>
            </SiteLink>
          </XStack>
        </YStack>
        <YStack height={260} $md={{flex: 1, flexBasis: 0, height: 340}}>
          <Photo
            photo="flyers"
            alt={t.community.photos.flyers}
            sizes="(min-width: 768px) 480px, 100vw"
            flex={1}
          />
        </YStack>
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
        <Eyebrow center>{copy.eyebrow}</Eyebrow>
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
              {Array.isNonEmptyReadonlyArray(events.upcoming)
                ? copy.browseEvents
                : copy.pastTitle}
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
            focus="65% 30%"
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
            photo="wristband"
            alt={copy.photos.wristband}
            sizes="(min-width: 1200px) 560px, 50vw"
            flex={1}
          />
          <Photo
            photo="teamBacks"
            alt={copy.photos.teamBacks}
            sizes="(min-width: 1200px) 560px, 50vw"
            flex={1}
          />
        </XStack>
      </PageSection>
    </>
  )
}
