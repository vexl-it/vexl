import {useNavigation} from '@react-navigation/native'
import {RowCheckbox} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {showVexlbotInitialMessageForAllChatsAtom} from '../../../../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistReminder(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const [dontShowSwitchValue, setDontShowSwitchValue] = useState<boolean>(false)

  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    showVexlbotNotificationsForCurrentChatAtom,
    showVexlbotInitialMessageForCurrentChatAtom,
    offerForChatAtom,
  } = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const offerForChat = useAtomValue(offerForChatAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const showVexlbotNotificationsForCurrentChat = useAtomValue(
    showVexlbotNotificationsForCurrentChatAtom
  )
  const [
    showVexlbotInitialMessageForCurrentChat,
    setShowVexlbotInitialMessageForCurrentChat,
  ] = useAtom(showVexlbotInitialMessageForCurrentChatAtom)
  const [
    showVexlbotInitialMessageForAllChats,
    setShowVexlbotInitialMessageForAllChats,
  ] = useAtom(showVexlbotInitialMessageForAllChatsAtom)

  if (
    !showVexlbotNotificationsForCurrentChat ||
    !showVexlbotInitialMessageForCurrentChat ||
    !showVexlbotInitialMessageForAllChats ||
    offerForChat?.offerInfo.publicPart.listingType === 'OTHER'
  )
    return null

  const offerIsInPerson =
    offerForChat?.offerInfo.publicPart.locationState.includes('IN_PERSON')

  return (
    <VexlbotActionCard
      buttonLabel={
        offerIsInPerson
          ? t('vexlbot.openTradeChecklist')
          : t('vexlbot.openTradeChecklistOnline')
      }
      description={t(
        offerIsInPerson
          ? 'vexlbot.initialWelcomeMessage'
          : 'vexlbot.initialWelcomeMessageOnline',
        {name: t('common.otherSide')}
      )}
      onClose={() => {
        setShowVexlbotInitialMessageForCurrentChat(false)
        if (dontShowSwitchValue) setShowVexlbotInitialMessageForAllChats(false)
      }}
      onButtonPress={() => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'AgreeOnTradeDetails',
          chatId,
          inboxKey,
        })
      }}
    >
      <RowCheckbox
        compact
        checked={dontShowSwitchValue}
        onCheckedChange={setDontShowSwitchValue}
        label={t('common.dontShowMeThisAgain')}
      />
    </VexlbotActionCard>
  )
}

export default TradeChecklistReminder
