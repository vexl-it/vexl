import {
  type BlogArticlePreview,
  type Event,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Banner,
  BlogCard,
  Calendar,
  ChevronRight,
  ClubCard,
  ConferenceClub,
  EventCard,
  Image,
  PencilWriteEdit,
  Stack,
  Typography,
  XStack,
  YStack,
  useTheme,
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
import {blogsStateAtom, loadBlogsActionAtom} from '../BlogScreen/state'
import ClubAvatar from '../ClubsScreen/components/ClubAvatar'
import {loadEventsActionAtom, upcomingEventsAtom} from '../EventsScreen/state'

const DATE_FORMAT = 'ddd, MMM D'
const DATE_FORMAT_YEAR = 'ddd, MMM D YYYY'
const TIME_FORMAT = 'HH:mm'
const BULLET = '•'
const CARD_WIDTH = 296
const BLOGS_LIMIT = 4

type Props = CommunityTabsScreenProps<'Discover'>

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

function SectionTitle({
  icon,
  iconOffsetY = 0,
  title,
  onPress,
}: {
  readonly icon: React.ReactNode
  readonly iconOffsetY?: number
  readonly title: string
  readonly onPress: () => void
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <Stack
      borderRadius="$3"
      onPress={onPress}
      pressStyle={{opacity: 0.65}}
      role="button"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Stack position="relative" top={iconOffsetY}>
            {icon}
          </Stack>
          <Typography color="$foregroundPrimary" variant="titlesSmall">
            {title}
          </Typography>
        </XStack>
        <ChevronRight color={theme.foregroundPrimary.get()} size={24} />
      </XStack>
    </Stack>
  )
}

function EventItem({event}: {readonly event: Event}): React.JSX.Element {
  return (
    <HorizontalItem>
      <EventCard
        title={event.name}
        details={[formatEventDate(event), event.venue]}
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

  return (
    <HorizontalItem>
      <ClubCard
        avatar={<ClubAvatar uri={club.clubImageUrl} />}
        name={club.name}
        subtitle={t('clubs.commonFriends', {count: members.length})}
        onPress={() => {
          navigation.navigate('ClubDetail', {clubUuid: club.uuid})
        }}
      />
    </HorizontalItem>
  )
}

function BlogItem({
  item,
}: {
  readonly item: BlogArticlePreview
}): React.JSX.Element {
  return (
    <HorizontalItem>
      <BlogCard
        image={<BlogImage mainImage={item.mainImage} />}
        title={item.title}
        description={Option.getOrElse(item.teaserText, () => '')}
        date={dayjs(item.publishedOn).format('LL')}
        onPress={() => {
          void Linking.openURL(item.link)
        }}
      />
    </HorizontalItem>
  )
}

function DiscoverScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
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
  const iconColor = theme.foregroundPrimary.get()
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
            <SectionTitle
              icon={<Calendar color={iconColor} size={24} />}
              title={t('events.upcomingEvents')}
              onPress={handleEventsPress}
            />
            <HorizontalRow>
              {pipe(
                upcomingEvents,
                Array.map((event) => <EventItem key={event.id} event={event} />)
              )}
            </HorizontalRow>
          </YStack>
        ) : null}

        <YStack gap="$6">
          <SectionTitle
            icon={<ConferenceClub color={iconColor} size={24} />}
            iconOffsetY={-1}
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
            <SectionTitle
              icon={<PencilWriteEdit color={iconColor} size={24} />}
              title={t('community.tabs.blog')}
              onPress={handleBlogPress}
            />
            <HorizontalRow>
              {pipe(
                latestBlogs,
                Array.map((item) => <BlogItem key={item.id} item={item} />)
              )}
            </HorizontalRow>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

export default DiscoverScreen
