import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistDateAndTimeSuggestionView(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {chatIdAtom, publicKeyPemBase64Atom, tradeChecklistDateAndTimeAtom} =
    useMolecule(chatMolecule)
  const tradeChecklistDateAndTimeData = useAtomValue(
    tradeChecklistDateAndTimeAtom
  )
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const dateAndTimePending = dateAndTime.dateAndTimePending(
    tradeChecklistDateAndTimeData
  )

  if (dateAndTimePending) return null

  return (
    <VexlbotBubble text={t('vexlbot.agreeOnPreferredDateAndTime')}>
      <Button
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'ChooseAvailableDays',
            chatId,
            inboxKey,
            params: {
              chosenDateTimes: tradeChecklistDateAndTimeData.sent?.suggestions,
            },
          })
        }}
        size="medium"
        variant="secondary"
        text={t('vexlbot.setDateAndTime')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistDateAndTimeSuggestionView
