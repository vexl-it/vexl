import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useMemo} from 'react'
import {getTokens, Stack} from 'tamagui'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import termsIconSvg from '../../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {type ToastNotificationState} from '../../../../ToastNotification/domain'
import {chatMolecule} from '../../../atoms'
import copySvg from '../../../images/copySvg'
import checkIconSvg from '../../images/checkIconSvg'
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
    addEventToCalendarActionAtom,
    isDateAndTimePickedAtom,
    calendarEventIdAtom,
    tradeChecklistMeetingLocationAtom,
    otherSideDataAtom,
    chatAtom,
  } = useMolecule(chatMolecule)
  const meetingLocationData = useAtomValue(tradeChecklistMeetingLocationAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const store = useStore()
  const navigation = useNavigation()
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)
  const isDateAndTimePicked = useAtomValue(isDateAndTimePickedAtom)
  const calendarEventId = useAtomValue(calendarEventIdAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const toastContent: ToastNotificationState = useMemo(
    () => ({
      visible: true,
      text: t('common.copied'),
      icon: checkIconSvg,
    }),
    [t]
  )

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
        <Stack gap="$2">
          <Button
            text={t('vexlbot.copyAddressInfo')}
            beforeIcon={copySvg}
            onPress={() => {
              Clipboard.setString(
                `${agreedOn.data.data.note}, ${agreedOn.data.data.address}`
              )
              setToastNotification(toastContent)
            }}
            size="small"
            variant="primary"
            iconFill={getTokens().color.main.val}
          />
          {!!isDateAndTimePicked && (
            <Button
              onPress={() => {
                void addEventToCalendar()()
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
        </Stack>
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
        <Stack gap="$2">
          <Button
            text={t('vexlbot.copyAddressInfo')}
            beforeIcon={copySvg}
            onPress={() => {
              Clipboard.setString(
                `${pendingSuggestion.data.data.note}, ${pendingSuggestion.data.data.address}`
              )
              setToastNotification(toastContent)
            }}
            size="small"
            variant="primary"
            iconFill={getTokens().color.main.val}
          />
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
        </Stack>
      </VexlbotBubble>
    )
  }

  return null
}
