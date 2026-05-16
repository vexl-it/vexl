import {useNavigation} from '@react-navigation/native'
import {
  CheckboxFilled,
  SquareOutline,
  Stack,
  Typography,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {TouchableOpacity} from 'react-native'
import {showVexlbotInitialMessageForAllChatsAtom} from '../../../../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistReminder(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const theme = useTheme()
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
      buttonText={
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
      onClosePress={() => {
        setShowVexlbotInitialMessageForCurrentChat(false)
        if (dontShowSwitchValue) setShowVexlbotInitialMessageForAllChats(false)
      }}
      onPress={() => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'AgreeOnTradeDetails',
          chatId,
          inboxKey,
        })
      }}
    >
      <Stack gap="$4">
        <TouchableOpacity
          onPress={() => {
            setDontShowSwitchValue(!dontShowSwitchValue)
          }}
        >
          <XStack gap="$2" alignItems="center">
            {dontShowSwitchValue ? (
              <CheckboxFilled
                size={18}
                color={theme.accentHighlightSecondary.get()}
              />
            ) : (
              <SquareOutline
                size={18}
                color={theme.foregroundSecondary.get()}
              />
            )}
            <Typography variant="micro" color="$foregroundSecondary">
              {t('common.dontShowMeThisAgain')}
            </Typography>
          </XStack>
        </TouchableOpacity>
      </Stack>
    </VexlbotActionCard>
  )
}

export default TradeChecklistReminder
