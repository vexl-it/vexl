import {
  type BlogArticlePreview,
  type Event,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Banner,
  BlogCard,
  Calendar,
  ConferenceClub,
  EventCard,
  getTokens,
  Image,
  PencilWriteEdit,
  ScrollView,
  SectionHeader,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, Order, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {Linking} from 'react-native'
import {type CommunityTabsScreenProps} from '../../../../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../../../../state/clubs/atom/clubsWithMembersAtom'
import atomKeyExtractor from '../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {
  formatDate,
  type FormattingLocale,
} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import {blogsStateAtom, loadBlogsActionAtom} from '../BlogScreen/state'
import ClubCardItem from '../ClubCardItem'
import {
  formatEventDate,
  toEventCardAttendee,
} from '../EventsScreen/eventCardContent'
import {loadEventsActionAtom, upcomingEventsAtom} from '../EventsScreen/state'

const CARD_WIDTH = 296
const BLOGS_LIMIT = 4

type Props = CommunityTabsScreenProps<'Discover'>

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
        paddingLeft: getTokens().space.$6.val,
        paddingRight: getTokens().space.$4.val,
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
        imageUri={Option.getOrUndefined(item.mainImage)}
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
      contentContainerStyle={{paddingBottom: getTokens().space.$7.val}}
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
                  <HorizontalItem key={atomKeyExtractor(clubAtom)}>
                    <ClubCardItem clubWithMembersAtom={clubAtom} />
                  </HorizontalItem>
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
