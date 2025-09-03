import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React from 'react'
import {Linking, Platform} from 'react-native'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {Stack, Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import Image from '../../../../Image'
import goldenGlassesNoStarSvg from '../images/goldenGlassesNoStarSvg'
import outLeadSvg from '../images/outLeadSvg'
import {
  createEventActionAtom,
  extendPastEventsActionAtom,
  type ListData,
} from '../state'
import EventDate from './EventDate'
import EventSpeaker from './EventSpeaker'

const BULLET = '•'

export default function EventItem({
  atom,
}: {
  atom: Atom<ListData>
}): React.ReactElement {
  const {t} = useTranslation()
  const data = useAtomValue(atom)
  const createEvent = useSetAtom(createEventActionAtom)
  const loadMoreEvents = useSetAtom(extendPastEventsActionAtom)

  if (data.type === 'header') {
    return (
      <YStack pb="$3" backgroundColor="black">
        <XStack ai="center" jc="space-between">
          <Text color="white" fontFamily="$body600" fontSize={24}>
            {data.value === 'future'
              ? t('events.upcomingEvents')
              : t('events.pastEvents')}
          </Text>
        </XStack>
        {!!data.emptySection && (
          <Text
            fontSize={14}
            fontFamily="$body400"
            mt="$2"
            color="$greyOnBlack"
          >
            {t('events.noEvents')}
          </Text>
        )}
      </YStack>
    )
  }

  if (data.type === 'createEvent') {
    return (
      <XStack ai="center" gap="$2" py="$4">
        <Text fs={1} col="$white">
          {t('events.doYouWantToListYourMeetup')}
        </Text>
        <TouchableOpacity onPress={createEvent}>
          <Text col="$main" ff="$body500" textDecorationLine="underline">
            {t('events.getInTouchWithUs')}
          </Text>
        </TouchableOpacity>
      </XStack>
    )
  }

  if (data.type === 'morePastEvents') {
    return (
      <Button
        size="small"
        onPress={loadMoreEvents}
        text={t('events.loadMore')}
        variant="primary"
      ></Button>
    )
  }

  if (data.type === 'allEventsLoaded') {
    return (
      <Stack mt="$0" alignItems="center" alignContent="center">
        <Text color="$greyOnBlack">{t('events.allLoaded')}</Text>
      </Stack>
    )
  }

  return (
    <XStack
      onPress={() => {
        void Linking.openURL(data.event.link)
      }}
      alignItems="center"
      gap="$2"
      mb="$2"
      br="$6"
      bc="$grey"
      p="$3"
    >
      <YStack gap="$2" flex={1}>
        <Text fontSize={12} color="$greyOnBlack" ff="$body500">
          <EventDate
            startDate={data.event.startDate}
            endDate={data.event.endDate}
          />{' '}
          {BULLET} {data.event.venue.replaceAll('/ /g', '\u00A0')}
        </Text>
        <Text fontSize={15} ff="$body600" color="white">
          {!!data.event.goldenGlasses && (
            <>
              <Image
                height={Platform.OS === 'ios' ? 14 : 10}
                width={26}
                source={goldenGlassesNoStarSvg}
              />{' '}
              {BULLET}{' '}
            </>
          )}
          {data.event.name}
        </Text>
        <XStack gap="$2" alignItems="flex-start" justifyContent="flex-start">
          {data.event.speakers.map((speaker) => (
            <EventSpeaker speaker={speaker} key={speaker.name} />
          ))}
        </XStack>
      </YStack>
      <Image source={outLeadSvg} />
    </XStack>
  )
}
