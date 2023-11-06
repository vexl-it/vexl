import {getTokens, Stack, Text, XStack} from 'tamagui'
import Image from '../../Image'
import vexlbotSvg from '../images/vexlbotSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {TouchableOpacity} from 'react-native'
import closeSvg from '../../images/closeSvg'
import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {type UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import Button from '../../Button'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import Checkbox from '../../Checkbox'
import {useAtom, useAtomValue} from 'jotai'
import {useState} from 'react'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {showVexlbotInitialMessageForAllChatsAtom} from '../../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'

interface Props {
  message: ChatMessage
  them: UserName
}

function VexlbotMessageItem({message, them}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const [dontShowSwitchValue, setDontShowSwitchValue] = useState<boolean>(false)

  const {
    showVexlbotNotificationsForCurrentChatAtom,
    showVexlbotInitialMessageForCurrentChatAtom,
  } = useMolecule(chatMolecule)
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
    <Stack
      m={'$4'}
      maxWidth={'80%'}
      br={'$6'}
      backgroundColor={'$grey'}
      p={'$3'}
      space={'$2'}
    >
      <XStack ai={'center'} jc={'space-between'}>
        <XStack ai={'center'} space={'$2'}>
          <Image width={24} height={24} source={vexlbotSvg} />
          <XStack>
            <Text fos={16} ff={'$body600'} col={'$white'}>
              {t('common.vexl')}
            </Text>
            <Text fos={16} ff={'$body600'} col={'$main'}>
              {t('vexlbot.bot')}
            </Text>
          </XStack>
        </XStack>
        <TouchableOpacity
          onPress={() => {
            setShowVexlbotInitialMessageForCurrentChat(false)
            if (dontShowSwitchValue)
              setShowVexlbotInitialMessageForAllChats(false)
          }}
        >
          <Image
            width={24}
            height={24}
            stroke={getTokens().color.greyOnBlack.val}
            source={closeSvg}
          />
        </TouchableOpacity>
      </XStack>
      <Text fos={16} ff={'$body500'} col={'$greyOnWhite'}>
        {message.messageType === 'VEXLBOT_INITIAL_MESSAGE' &&
          t('vexlbot.initialWelcomeMessage', {name: them})}
      </Text>
      {message.messageType === 'VEXLBOT_INITIAL_MESSAGE' && (
        <Stack space={'$4'}>
          <Button
            beforeIcon={tradeChecklistSvg}
            iconSize={24}
            iconFill={getTokens().color.darkBrown.val}
            onPress={() => {}}
            variant={'secondary'}
            size={'medium'}
            text={t('vexlbot.openTradeChecklist')}
          />
          <XStack space={'$2'}>
            <Checkbox
              size={'small'}
              value={dontShowSwitchValue}
              onChange={() => {
                setDontShowSwitchValue(!dontShowSwitchValue)
              }}
            />
            <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
              {t('common.dontShowMeThisAgain')}
            </Text>
          </XStack>
        </Stack>
      )}
    </Stack>
  )
}

export default VexlbotMessageItem
