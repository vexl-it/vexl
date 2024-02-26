import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {addEventToCalendarActionAtom} from '../../../../../utils/calendar'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import termsIconSvg from '../../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function getTextForVexlbot({
  by,
  otherSideUsername,
  note,
  address,
  t,
}: {
  by: 'me' | 'them'
  otherSideUsername: string
  address: string
  note?: string
  t: TFunction
}): string {
  return `${
    by === 'me'
      ? t('tradeChecklist.location.youSetMeetingLocation')
      : t('tradeChecklist.location.themSetMeetingLocation', {
          them: otherSideUsername,
        })
  } \n${address}${note ? `\n${note}` : ''}`
}

export default function TradeChecklistMeetingLocationView(): JSX.Element | null {
  const {t} = useTranslation()
  const {
    calendarEventIdAtom,
    tradeChecklistDateAndTimeAtom,
    tradeChecklistMeetingLocationAtom,
    otherSideDataAtom,
    chatAtom,
  } = useMolecule(chatMolecule)
  const meetingLocationData = useAtomValue(tradeChecklistMeetingLocationAtom)
  const dateAndTimeData = useAtomValue(tradeChecklistDateAndTimeAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const store = useStore()
  const navigation = useNavigation()
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)
  const pickedDateAndTime = dateAndTime.getPick(dateAndTimeData)
  const calendarEventId = useAtomValue(calendarEventIdAtom)

  const agreedOn = MeetingLocation.getAgreed(meetingLocationData)
  if (agreedOn) {
    return (
      <VexlbotBubble
        status="accepted"
        text={getTextForVexlbot({
          by: agreedOn.by,
          address: agreedOn.data.data.address,
          note: agreedOn.data.data.note,
          otherSideUsername: otherSideData.userName,
          t,
        })}
      >
        {!!pickedDateAndTime && (
          <Button
            onPress={() => {
              void addEventToCalendar({
                calendarEventIdAtom,
                event: {
                  startDate: DateTime.fromMillis(
                    pickedDateAndTime.pick.dateTime
                  ).toJSDate(),
                  endDate: DateTime.fromMillis(
                    pickedDateAndTime.pick.dateTime
                  ).toJSDate(),
                  title: t('tradeChecklist.vexlMeetingEventTitle', {
                    name: otherSideData.userName,
                  }),
                  location: agreedOn?.data.data?.address,
                  notes: agreedOn?.data.data.note,
                },
              })()
            }}
            beforeIcon={termsIconSvg}
            size="small"
            variant="primary"
            text={
              calendarEventId
                ? t('vexlbot.updateCalendarEventLocation')
                : t('vexlbot.addEventToCalendar')
            }
          />
        )}
      </VexlbotBubble>
    )
  }

  const pendingSuggestion =
    MeetingLocation.getPendingSuggestion(meetingLocationData)
  if (pendingSuggestion) {
    return (
      <VexlbotBubble
        status="pending"
        text={getTextForVexlbot({
          by: pendingSuggestion.by,
          address: pendingSuggestion.data.data.address,
          note: pendingSuggestion.data.data.note,
          otherSideUsername: otherSideData.userName,
          t,
        })}
      >
        {pendingSuggestion.by === 'them' && (
          <Button
            onPress={() => {
              const chat = store.get(chatAtom)
              navigation.navigate('TradeChecklistFlow', {
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                screen: 'LocationMapPreview',
                params: {
                  selectedLocation: pendingSuggestion.data.data,
                },
              })
            }}
            variant="secondary"
            size="small"
            text={t('common.respond')}
          />
        )}
      </VexlbotBubble>
    )
  }

  return null
}
