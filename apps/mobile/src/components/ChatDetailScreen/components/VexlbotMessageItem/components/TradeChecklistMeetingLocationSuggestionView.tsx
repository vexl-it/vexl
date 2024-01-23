import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import * as location from '../../../../../state/tradeChecklist/utils/location'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistMeetingLocationSuggestionView(): JSX.Element | null {
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
    <VexlbotBubble text={t('vexlbot.agreeOnPreferredLocation')}>
      <Button
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'LocationSearch',
            chatId,
            inboxKey,
            params: {},
          })
        }}
        size="medium"
        variant="secondary"
        text={t('vexlbot.setMeetingLocation')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistMeetingLocationSuggestionView
