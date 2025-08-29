import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useMemo} from 'react'
import {getTokens, Stack} from 'tamagui'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import checkIconSvg from '../../../../images/checkIconSvg'
import copySvg from '../../../../images/copySvg'
import termsIconSvg from '../../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {type ToastNotificationState} from '../../../../ToastNotification/domain'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

function getTextForVexlbot({
  agreed,
  by,
  otherSideUsername,
  note,
  address,
  t,
}: {
  agreed: boolean
  by: 'me' | 'them'
  otherSideUsername: string
  address: string
  note?: string
  t: TFunction
}): string {
  return agreed
    ? `${
        by === 'me'
          ? t('tradeChecklist.location.youAgreedToMeetingLocation')
          : t('tradeChecklist.location.themAgreedToMeetingLocation', {
              them: otherSideUsername,
            })
      } \n${address}${note ? `\n${note}` : ''}`
    : `${
        by === 'me'
          ? t('tradeChecklist.location.youSetMeetingLocation')
          : t('tradeChecklist.location.themSetMeetingLocation', {
              them: otherSideUsername,
            })
      } \n${address}${note ? `\n${note}` : ''}`
}

interface Props {
  message: ChatMessageWithState
}

export default function TradeChecklistMeetingLocationView({
  message,
}: Props): React.ReactElement | null {
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
  const latestMeetingLocationDataMessage =
    MeetingLocation.getLatestMeetingLocationDataMessage(meetingLocationData)
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

  if (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
    message.message.tradeChecklistUpdate?.location
  ) {
    const isMessageOutdated =
      message.message.tradeChecklistUpdate.location.timestamp !==
      latestMeetingLocationDataMessage?.locationData.timestamp

    if (
      latestMeetingLocationDataMessage?.status === 'accepted' &&
      !isMessageOutdated
    ) {
      return (
        <>
          <VexlbotBubble
            messageState={message.state}
            username={otherSideData.userName}
            status="accepted"
            text={getTextForVexlbot({
              agreed: true,
              by: message.state === 'sent' ? 'me' : 'them',
              address:
                message.message.tradeChecklistUpdate.location.data.address,
              note: message.message.tradeChecklistUpdate.location.data.note,
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
                    `${message.message.tradeChecklistUpdate?.location?.data.note}, ${message.message.tradeChecklistUpdate?.location?.data.address}`
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
          <VexlbotNextActionSuggestion />
        </>
      )
    }

    return (
      <VexlbotBubble
        messageState={message.state}
        username={otherSideData.userName}
        status={
          isMessageOutdated ? ('outdated' as const) : ('pending' as const)
        }
        text={getTextForVexlbot({
          agreed: false,
          by: message.state === 'sent' ? 'me' : 'them',
          address: message.message.tradeChecklistUpdate.location.data.address,
          note: message.message.tradeChecklistUpdate.location.data.note,
          otherSideUsername: otherSideData.userName,
          t,
        })}
      >
        {!isMessageOutdated && (
          <Stack gap="$2">
            <Button
              text={t('vexlbot.copyAddressInfo')}
              beforeIcon={copySvg}
              onPress={() => {
                Clipboard.setString(
                  `${message.message.tradeChecklistUpdate?.location?.data.note}, ${message.message.tradeChecklistUpdate?.location?.data.address}`
                )
                setToastNotification(toastContent)
              }}
              size="small"
              variant="primary"
              iconFill={getTokens().color.main.val}
            />
            {message.state === 'received' && (
              <Button
                onPress={() => {
                  const chat = store.get(chatAtom)
                  const location =
                    message.message.tradeChecklistUpdate?.location?.data

                  if (location) {
                    navigation.navigate('TradeChecklistFlow', {
                      chatId: chat.id,
                      inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                      screen: 'LocationMapPreview',
                      params: {
                        selectedLocation: location,
                      },
                    })
                  }
                }}
                variant="secondary"
                size="small"
                text={t('common.respond')}
              />
            )}
          </Stack>
        )}
      </VexlbotBubble>
    )
  }

  return null
}
