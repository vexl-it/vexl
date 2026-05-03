import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {Button, Calendar, Copy, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array as ArrayE, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

function getTextForVexlbot({
  agreed,
  by,
  note,
  address,
  t,
}: {
  agreed: boolean
  by: 'me' | 'them'
  address: string
  note?: string
  t: TFunction
}): string {
  return agreed
    ? `${t('messages.vexlBot.locationIsSet')} ${address}${note ? ` ${note}` : ''}`
    : `${by === 'me' ? t('messages.vexlBot.meeting') : t('messages.vexlBot.doesThisWork')} ${address}${note ? ` ${note}` : ''}`
}

function splitCardText(text: string): {
  readonly description: string
  readonly details: readonly string[]
} {
  const [description, ...details] = pipe(
    text.split('\n'),
    ArrayE.filter((item) => item.length > 0)
  )

  return {
    description: description ?? '',
    details,
  }
}

function getMeetingLocationClipboardText({
  address,
  note,
}: {
  readonly address: string
  readonly note?: string
}): string {
  return note ? `${note}, ${address}` : address
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
    chatAtom,
    lastTradeChecklistMessageAtom,
  } = useMolecule(chatMolecule)
  const lastTradeChecklistMessage = useAtomValue(lastTradeChecklistMessageAtom)
  const meetingLocationData = useAtomValue(tradeChecklistMeetingLocationAtom)
  const store = useStore()
  const navigation = useNavigation()
  const latestMeetingLocationDataMessage =
    MeetingLocation.getLatestMeetingLocationDataMessage(meetingLocationData)
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)
  const isDateAndTimePicked = useAtomValue(isDateAndTimePickedAtom)
  const calendarEventId = useAtomValue(calendarEventIdAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const toastContent = t('common.copied')

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
      const cardText = splitCardText(
        getTextForVexlbot({
          agreed: true,
          by: message.state === 'sent' ? 'me' : 'them',
          address: message.message.tradeChecklistUpdate.location.data.address,
          note: message.message.tradeChecklistUpdate.location.data.note,
          t,
        })
      )

      return (
        <>
          <VexlbotActionCard
            mb="$2"
            title={t('tradeChecklist.options.MEETING_LOCATION')}
            description={cardText.description}
            details={cardText.details}
            statusLabel={t('common.accepted')}
            statusVariant="waiting"
          >
            <XStack gap="$3">
              <Button
                f={1}
                onPress={() => {
                  Clipboard.setString(
                    getMeetingLocationClipboardText({
                      address:
                        message.message.tradeChecklistUpdate?.location?.data
                          .address ?? '',
                      note: message.message.tradeChecklistUpdate?.location?.data
                        .note,
                    })
                  )
                  setToastNotification(toastContent)
                }}
                icon={Copy}
                size="small"
                variant="secondary"
              >
                {t('vexlbot.copyAddressInfo')}
              </Button>
              {!!isDateAndTimePicked && (
                <Button
                  f={1}
                  onPress={() => {
                    void addEventToCalendar()()
                  }}
                  icon={Calendar}
                  size="small"
                  variant="secondary"
                >
                  {calendarEventId
                    ? t('vexlbot.updateCalendarEventLocation')
                    : t('vexlbot.addEventToCalendar')}
                </Button>
              )}
            </XStack>
          </VexlbotActionCard>
          {Option.isSome(lastTradeChecklistMessage) &&
            lastTradeChecklistMessage.value.message.uuid ===
              message.message.uuid && <VexlbotNextActionSuggestion />}
        </>
      )
    }

    const cardText = splitCardText(
      getTextForVexlbot({
        agreed: false,
        by: message.state === 'sent' ? 'me' : 'them',
        address: message.message.tradeChecklistUpdate.location.data.address,
        note: message.message.tradeChecklistUpdate.location.data.note,
        t,
      })
    )
    const pendingLabel =
      message.state === 'received'
        ? t('vexlbot.reactionRequired')
        : t('vexlbot.waitingFor', {username: t('common.otherSide')})

    const title =
      message.state === 'sent'
        ? t('messages.vexlBot.locationIsSet')
        : t('messages.vexlBot.letsAgreeOnLocation')

    return (
      <VexlbotActionCard
        mb="$2"
        description={cardText.description}
        details={cardText.details}
        statusLabel={isMessageOutdated ? t('common.outdated') : pendingLabel}
        statusVariant={
          isMessageOutdated ? 'outdated' : 'waitingForConfirmation'
        }
        title={title}
      >
        {!isMessageOutdated && (
          <YStack gap="$3">
            <Button
              f={1}
              onPress={() => {
                Clipboard.setString(
                  getMeetingLocationClipboardText({
                    address:
                      message.message.tradeChecklistUpdate?.location?.data
                        .address ?? '',
                    note: message.message.tradeChecklistUpdate?.location?.data
                      .note,
                  })
                )
                setToastNotification(toastContent)
              }}
              icon={Copy}
              size="small"
              variant="secondary"
            >
              {t('vexlbot.copyAddressInfo')}
            </Button>
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
                variant="primary"
                size="medium"
              >
                {t('common.respond')}
              </Button>
            )}
          </YStack>
        )}
      </VexlbotActionCard>
    )
  }

  return null
}
