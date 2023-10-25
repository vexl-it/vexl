import IconButton from '../../IconButton'
import {getTokens, Stack, XStack} from 'tamagui'
import OtherSideNamePhotoAndInfo from './OtherSideNamePhotoAndInfo'
import backButtonSvg from '../../../images/backButtonSvg'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {Keyboard, TouchableOpacity} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import binSvg from '../images/binSvg'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import blockIconSvg from '../../../images/blockIconSvg'
import {useNavigation} from '@react-navigation/native'

type ButtonType =
  | 'back'
  | 'closeModal'
  | 'deleteChat'
  | 'block'
  | 'tradeChecklist'
  | null

function Button({type}: {type: ButtonType}): JSX.Element | null {
  const safeGoBack = useSafeGoBack()
  const navigation = useNavigation()
  const {
    chatAtom,
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    forceShowHistoryAtom,
  } = useMolecule(chatMolecule)
  const setModal = useSetAtom(showModalAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()

  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)

  const [forceShowHistory, setForceShowHistory] = useAtom(forceShowHistoryAtom)
  const chat = useAtomValue(chatAtom)

  const onGoBackPressed = useCallback(() => {
    if (forceShowHistory) {
      setForceShowHistory(false)
    } else {
      safeGoBack()
    }
  }, [forceShowHistory, safeGoBack, setForceShowHistory])

  if (type === 'back')
    return (
      <IconButton
        icon={backButtonSvg}
        variant={'primary'}
        onPress={onGoBackPressed}
      />
    )

  if (type === 'closeModal')
    return (
      <IconButton
        icon={backButtonSvg}
        variant={'primary'}
        onPress={() => {
          Keyboard.dismiss()
          setModal(false)
        }}
      />
    )

  if (type === 'block')
    return (
      <IconButton
        icon={blockIconSvg}
        variant={'negative'}
        onPress={() => {
          Keyboard.dismiss()
          void blockChat().then((success) => {
            if (success) resetNavigationToMessagingScreen()
          })
        }}
      />
    )

  if (type === 'deleteChat')
    return (
      <IconButton
        icon={binSvg}
        variant={'negative'}
        onPress={() => {
          Keyboard.dismiss()
          void deleteChat().then((success) => {
            if (success) resetNavigationToMessagingScreen()
          })
        }}
      />
    )

  if (type === 'tradeChecklist')
    return (
      <IconButton
        icon={tradeChecklistSvg}
        variant={'primary'}
        onPress={() => {
          Keyboard.dismiss()
          setModal(false)
          navigation.navigate('TradeChecklistFlow', {
            screen: 'AgreeOnTradeDetails',
            params: {
              chatId: chat.id,
              inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
            },
          })
        }}
        iconFill={getTokens().color.main.val}
        iconHeight={24}
        iconWidth={24}
      />
    )

  return <Stack w={40} h={40} />
}

function ChatHeader({
  leftButton,
  rightButton,
  mode,
  onPressMiddle = () => {},
}: {
  mode: 'photoTop' | 'photoLeft'
  leftButton: ButtonType
  rightButton: ButtonType
  onPressMiddle?: () => void
}): JSX.Element {
  const handleMiddlePress = useCallback(() => {
    Keyboard.dismiss()
    onPressMiddle()
  }, [onPressMiddle])
  return (
    <XStack mx={'$4'} mt={'$4'}>
      <Button type={leftButton} />

      <Stack f={1} mx={mode === 'photoLeft' ? '$2' : 0}>
        <TouchableOpacity onPress={handleMiddlePress}>
          <OtherSideNamePhotoAndInfo mode={mode} />
        </TouchableOpacity>
      </Stack>

      <Button type={rightButton} />
    </XStack>
  )
}

export default ChatHeader
