import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import {useState} from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import tradeChecklistSvg from '../../../../../images/tradeChecklistSvg'
import {showVexlbotInitialMessageForAllChatsAtom} from '../../../../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import Checkbox from '../../../../Checkbox'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistReminder(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const [dontShowSwitchValue, setDontShowSwitchValue] = useState<boolean>(false)

  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    showVexlbotNotificationsForCurrentChatAtom,
    showVexlbotInitialMessageForCurrentChatAtom,
    otherSideDataAtom,
  } = useMolecule(chatMolecule)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const chatId = useAtomValue(chatIdAtom)
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
    !showVexlbotInitialMessageForAllChats
  )
    return null

  return (
    <VexlbotBubble
      onCancelPress={() => {
        setShowVexlbotInitialMessageForCurrentChat(false)
        if (dontShowSwitchValue) setShowVexlbotInitialMessageForAllChats(false)
      }}
      text={t('vexlbot.initialWelcomeMessage', {name: otherSideData.userName})}
    >
      <Stack space="$4">
        <Button
          beforeIcon={tradeChecklistSvg}
          iconSize={24}
          iconFill={getTokens().color.darkBrown.val}
          onPress={() => {
            navigation.navigate('TradeChecklistFlow', {
              screen: 'AgreeOnTradeDetails',
              chatId,
              inboxKey,
            })
          }}
          variant="secondary"
          size="medium"
          text={t('vexlbot.openTradeChecklist')}
        />
        <XStack space="$2">
          <Checkbox
            size="small"
            value={dontShowSwitchValue}
            onChange={() => {
              setDontShowSwitchValue(!dontShowSwitchValue)
            }}
          />
          <Text fos={12} ff="$body500" col="$greyOnBlack">
            {t('common.dontShowMeThisAgain')}
          </Text>
        </XStack>
      </Stack>
    </VexlbotBubble>
  )
}

export default TradeChecklistReminder
