import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {Linking, Platform} from 'react-native'
import {Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import Image from '../../../../Image'
import goldenGlassesNoStarSvg from '../images/goldenGlassesNoStarSvg'
import outLeadSvg from '../images/outLeadSvg'
import {createEventActionAtom, type ListData} from '../state'
import EventDate from './EventDate'
import EventSpeaker from './EventSpeaker'

const BULLET = '•'

export default function EventItem({atom}: {atom: Atom<ListData>}): JSX.Element {
  const {t} = useTranslation()
  const data = useAtomValue(atom)
  const createEvent = useSetAtom(createEventActionAtom)

  if (data.type === 'header') {
    return (
      <YStack pb="$3" backgroundColor="black">
        <XStack ai="center" jc="space-between">
          <Text color="white" fontFamily="$body600" fontSize={24}>
            {data.value === 'future'
              ? t('events.upcomingEvents')
              : t('events.pastEvents')}
          </Text>
          <Button
            size="small"
            variant="secondary"
            text={t('events.addEvent')}
            onPress={createEvent}
          />
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
