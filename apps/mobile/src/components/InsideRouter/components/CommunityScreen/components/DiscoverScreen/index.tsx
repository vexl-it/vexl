import {
  type BlogArticlePreview,
  type Event,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Banner,
  BlogCard,
  Calendar,
  ClubCard,
  ConferenceClub,
  EventCard,
  Image,
  PencilWriteEdit,
  SectionHeader,
  Stack,
  YStack,
  type EventCardAttendee,
} from '@vexl-next/ui'
import dayjs from 'dayjs'
import {Array, Option, Order, pipe} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {Linking} from 'react-native'
import {ScrollView} from 'tamagui'
import {type CommunityTabsScreenProps} from '../../../../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../../../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../../../../../state/clubs/domain'
import atomKeyExtractor from '../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {
  formatDate,
  formatInteger,
  formatTime,
  type FormattingLocale,
} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import {blogsStateAtom, loadBlogsActionAtom} from '../BlogScreen/state'
import ClubAvatar from '../ClubsScreen/components/ClubAvatar'
import {loadEventsActionAtom, upcomingEventsAtom} from '../EventsScreen/state'

const BULLET = '•'
const CARD_WIDTH = 296
const BLOGS_LIMIT = 4

type Props = CommunityTabsScreenProps<'Discover'>

function formatEventDate(event: Event, locale: FormattingLocale): string {
  const startDate = dayjs(event.startDate)
  const formattedStartDate = formatDate(new Date(event.startDate), locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: startDate.isSame(dayjs(), 'year') ? undefined : 'numeric',
  })
  const formattedStartTime = formatTime(new Date(event.startDate), locale)

  return Option.match(event.endDate, {
    onNone: () => `${formattedStartDate} ${BULLET} ${formattedStartTime}`,
    onSome: (endDate) => {
      const formattedEndDate = dayjs(endDate)
      const endDateValue = new Date(endDate)

      if (formattedEndDate.isSame(startDate, 'day')) {
        return `${formattedStartDate} ${BULLET} ${formattedStartTime}-${formatTime(endDateValue, locale)}`
      }

      return `${formattedStartDate} - ${formatDate(endDateValue, locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}`
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

function BlogImage({
  mainImage,
}: {
  readonly mainImage: BlogArticlePreview['mainImage']
}): React.JSX.Element {
  return Option.match(mainImage, {
    onNone: () => (
      <Stack width="100%" height={162} backgroundColor="$backgroundTertiary" />
    ),
    onSome: (uri) => (
      <Image source={{uri}} width="100%" height={162} objectFit="cover" />
    ),
  })
}

function HorizontalItem({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Stack width={CARD_WIDTH} flexShrink={0} marginRight="$2">
      {children}
    </Stack>
  )
}

function HorizontalRow({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      marginHorizontal="$-5"
      contentContainerStyle={{
        paddingLeft: 20,
        paddingRight: 12,
      }}
    >
      {children}
    </ScrollView>
  )
}

function EventItem({
  event,
  locale,
}: {
  readonly event: Event
  readonly locale: FormattingLocale
}): React.JSX.Element {
  return (
    <HorizontalItem>
      <EventCard
        title={event.name}
        details={[formatEventDate(event, locale), event.venue]}
        attendees={pipe(event.speakers, Array.map(toEventCardAttendee))}
        state="upcoming"
        onPress={() => {
          void Linking.openURL(event.link)
        }}
      />
    </HorizontalItem>
  )
}

function ClubItem({
  atom,
  navigation,
}: {
  readonly atom: Atom<ClubWithMembers>
  readonly navigation: Props['navigation']
}): React.JSX.Element {
  const {club, members} = useAtomValue(atom)
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <HorizontalItem>
      <ClubCard
        avatar={<ClubAvatar uri={club.clubImageUrl} />}
        name={club.name}
        subtitle={t('clubs.commonFriendsFormatted', {
          localizedString: formatInteger(members.length, locale),
        })}
        onPress={() => {
          navigation.navigate('ClubDetail', {clubUuid: club.uuid})
        }}
      />
    </HorizontalItem>
  )
}

function BlogItem({
  item,
  locale,
}: {
  readonly item: BlogArticlePreview
  readonly locale: FormattingLocale
}): React.JSX.Element {
  return (
    <HorizontalItem>
      <BlogCard
        image={<BlogImage mainImage={item.mainImage} />}
        title={item.title}
        description={Option.getOrElse(item.teaserText, () => '')}
        date={formatDate(new Date(item.publishedOn), locale, {
          dateStyle: 'long',
        })}
        onPress={() => {
          void Linking.openURL(item.link)
        }}
      />
    </HorizontalItem>
  )
}

function DiscoverScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const loadEvents = useSetAtom(loadEventsActionAtom)
  const loadBlogs = useSetAtom(loadBlogsActionAtom)
  const upcomingEvents = useAtomValue(upcomingEventsAtom)
  const clubsAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const blogsData = useAtomValue(blogsStateAtom).data
  const latestBlogs = useMemo(
    () =>
      Option.match(blogsData, {
        onNone: () => [],
        onSome: ({articles}) =>
          pipe(
            articles,
            Array.sortWith(
              (article) => article.publishedOn,
              Order.reverse(Order.Date)
            ),
            Array.take(BLOGS_LIMIT)
          ),
      }),
    [blogsData]
  )
  const hasClubs = clubsAtoms.length > 0
  const handleEventsPress = useCallback(() => {
    navigation.navigate('Events')
  }, [navigation])
  const handleClubsPress = useCallback(() => {
    navigation.navigate('Clubs')
  }, [navigation])
  const handleBlogPress = useCallback(() => {
    navigation.navigate('Blog')
  }, [navigation])
  const handleJoinClubPress = useCallback(() => {
    navigation.navigate('JoinClubFlow', {
      screen: 'ScanClubQrCodeScreen',
    })
  }, [navigation])
  const handleWhatAreClubsPress = useCallback(() => {
    navigation.navigate('WhatAreClubs')
  }, [navigation])

  useEffect(() => {
    void loadEvents()
    void loadBlogs()
  }, [loadBlogs, loadEvents])

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingBottom: 24}}
    >
      <YStack f={1} paddingHorizontal="$5" paddingTop="$6" gap="$6">
        {Array.isNonEmptyReadonlyArray(upcomingEvents) ? (
          <YStack gap="$4">
            <SectionHeader
              icon={Calendar}
              title={t('events.upcomingEvents')}
              onPress={handleEventsPress}
            />
            <HorizontalRow>
              {pipe(
                upcomingEvents,
                Array.map((event) => (
                  <EventItem key={event.id} event={event} locale={locale} />
                ))
              )}
            </HorizontalRow>
          </YStack>
        ) : null}

        <YStack gap="$6">
          <SectionHeader
            icon={ConferenceClub}
            title={t('community.tabs.clubs')}
            onPress={handleClubsPress}
          />
          {hasClubs ? (
            <HorizontalRow>
              {pipe(
                clubsAtoms,
                Array.map((clubAtom) => (
                  <ClubItem
                    key={atomKeyExtractor(clubAtom)}
                    atom={clubAtom}
                    navigation={navigation}
                  />
                ))
              )}
            </HorizontalRow>
          ) : (
            <Banner
              color="green"
              image={
                <Image
                  source={require('./images/clubsilustration.png')}
                  width="100%"
                  height={88}
                  objectFit="cover"
                />
              }
              title={t('clubs.joinAClub')}
              description={t('clubs.joinAClubDescription')}
              primaryButton={{
                label: t('clubs.joinNewClub'),
                onPress: handleJoinClubPress,
              }}
              secondaryButton={{
                label: t('clubs.moreInfo'),
                onPress: handleWhatAreClubsPress,
              }}
            />
          )}
        </YStack>

        {Array.isNonEmptyReadonlyArray(latestBlogs) ? (
          <YStack gap="$4">
            <SectionHeader
              icon={PencilWriteEdit}
              title={t('community.tabs.blog')}
              onPress={handleBlogPress}
            />
            <HorizontalRow>
              {pipe(
                latestBlogs,
                Array.map((item) => (
                  <BlogItem key={item.id} item={item} locale={locale} />
                ))
              )}
            </HorizontalRow>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

export default DiscoverScreen
