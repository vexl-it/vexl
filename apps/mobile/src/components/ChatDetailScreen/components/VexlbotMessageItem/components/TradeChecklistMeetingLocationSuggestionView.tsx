import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import * as location from '../../../../../state/tradeChecklist/utils/location'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistMeetingLocationSuggestionView(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    tradeChecklistMeetingLocationAtom,
  } = useMolecule(chatMolecule)
  const locationData = useAtomValue(tradeChecklistMeetingLocationAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const locationPending = location.locationPending(locationData)

  if (locationPending) return null

  return (
    <VexlbotActionCard
      buttonText={t('vexlbot.setMeetingLocation')}
      description={t('vexlbot.agreeOnPreferredLocation')}
      onPress={() => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'LocationSearch',
          chatId,
          inboxKey,
        })
      }}
      title={t('tradeChecklist.options.MEETING_LOCATION')}
    />
  )
}

export default TradeChecklistMeetingLocationSuggestionView
