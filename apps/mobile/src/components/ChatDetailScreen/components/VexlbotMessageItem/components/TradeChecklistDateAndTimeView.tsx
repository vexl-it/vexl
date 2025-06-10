import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import termsIconSvg from '../../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

export default function TradeChecklistDateAndTimeView({
  message,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    addEventToCalendarActionAtom,
    tradeChecklistDateAndTimeAtom,
    otherSideDataAtom,
    chatAtom,
  } = useMolecule(chatMolecule)
  const store = useStore()
  const dateAndTimeData = useAtomValue(tradeChecklistDateAndTimeAtom)
  const latestDateAndTimeDataMessageTimestamp =
    dateAndTime.getLatestMessageTimestamp(dateAndTimeData)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)

  if (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
    message.message.tradeChecklistUpdate?.dateAndTime
  ) {
    const isMessageOutdated =
      message.message.tradeChecklistUpdate.dateAndTime?.timestamp !==
      latestDateAndTimeDataMessageTimestamp

    const pick = message.message.tradeChecklistUpdate.dateAndTime.picks

    if (!!pick && !isMessageOutdated) {
      return (
        <>
          <VexlbotBubble
            username={otherSideData.userName}
            messageState={message.state}
            status="accepted"
            text={`${t('vexlbot.yourMeetingIsOn')}\n${dateAndTime.toStringWithTime(
              pick.dateTime
            )}`}
          >
            <Button
              onPress={() => {
                void addEventToCalendar()()
              }}
              beforeIcon={termsIconSvg}
              size="small"
              variant="primary"
              text={t('vexlbot.addEventToCalendar')}
            />
          </VexlbotBubble>
          <VexlbotNextActionSuggestion />
        </>
      )
    }

    const suggestions =
      message.message.tradeChecklistUpdate.dateAndTime.suggestions
    if (suggestions && suggestions.length > 0) {
      return (
        <VexlbotBubble
          username={otherSideData.userName}
          messageState={message.state}
          status={
            isMessageOutdated ? ('outdated' as const) : ('pending' as const)
          }
          text={`${t(
            message.state === 'sent'
              ? 'vexlbot.youAddedTimeOptions'
              : 'vexlbot.themAddedTimeOptions',
            {
              them: otherSideData.userName,
              number: suggestions.length,
            }
          )}\n${suggestions
            .map((one) =>
              // TODO: remove this in future once everybody
              // updates to new DateTime checklist system
              // use toStringWithTime(one.to)
              DateTime.fromMillis(one.to).diff(
                DateTime.fromMillis(one.from),
                'hours'
              ).hours >= 1
                ? dateAndTime.toStringWithRange(one)
                : dateAndTime.toStringWithTime(one.to)
            )
            .join('\n')}`}
        >
          {message.state === 'received' && !isMessageOutdated && (
            <Button
              onPress={() => {
                const chat = store.get(chatAtom)
                navigation.navigate('TradeChecklistFlow', {
                  chatId: chat.id,
                  inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                  screen: 'PickDateFromSuggestions',
                  params: {
                    chosenDateTimes: suggestions,
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
  }

  return null
}
