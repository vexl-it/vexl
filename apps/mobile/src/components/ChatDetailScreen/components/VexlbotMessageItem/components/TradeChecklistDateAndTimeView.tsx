import {useNavigation} from '@react-navigation/native'
import {useAtomValue, useStore} from 'jotai'
import {useMolecule} from 'bunshi/dist/react'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

export default function TradeChecklistDateAndTimeView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {tradeChecklistDateAndTimeAtom, otherSideDataAtom, chatAtom} =
    useMolecule(chatMolecule)
  const store = useStore()
  const dateAndTimeData = useAtomValue(tradeChecklistDateAndTimeAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const pick = dateAndTime.getPick(dateAndTimeData)
  if (pick) {
    return (
      <VexlbotBubble
        status={'accepted'}
        text={`${t('vexlbot.yourMeetingIsOn')}\n${dateAndTime.toStringWithTime(
          pick.pick.dateTime
        )}`}
      ></VexlbotBubble>
    )
  }

  const suggestions = dateAndTime.getSuggestions(dateAndTimeData)
  if (suggestions && suggestions.suggestions.length > 0) {
    return (
      <VexlbotBubble
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
                  submitUpdateOnTimePick: true,
                },
              })
            }}
            variant={'secondary'}
            size={'small'}
            text={t('common.respond')}
          />
        )}
      </VexlbotBubble>
    )
  }

  return null
}
