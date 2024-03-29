import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import termsIconSvg from '../../../../InsideRouter/components/SettingsScreen/images/termsIconSvg'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

export default function TradeChecklistDateAndTimeView(): JSX.Element | null {
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
  const otherSideData = useAtomValue(otherSideDataAtom)
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)

  const pick = dateAndTime.getPick(dateAndTimeData)
  if (pick) {
    return (
      <VexlbotBubble
        status="accepted"
        text={`${t('vexlbot.yourMeetingIsOn')}\n${dateAndTime.toStringWithTime(
          pick.pick.dateTime
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
    )
  }

  const suggestions = dateAndTime.getSuggestions(dateAndTimeData)
  if (suggestions && suggestions.suggestions.length > 0) {
    return (
      <VexlbotBubble
        status="pending"
        text={`${t(
          suggestions.by === 'me'
            ? 'vexlbot.youAddedTimeOptions'
            : 'vexlbot.themAddedTimeOptions',
          {
            them: otherSideData.userName,
            number: suggestions.suggestions.length,
          }
        )}\n${suggestions.suggestions
          .map((one) => dateAndTime.toStringWithRange(one))
          .join('\n')}`}
      >
        {suggestions.by === 'them' && (
          <Button
            onPress={() => {
              const chat = store.get(chatAtom)
              navigation.navigate('TradeChecklistFlow', {
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                screen: 'PickDateFromSuggestions',
                params: {
                  chosenDays: suggestions.suggestions,
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
