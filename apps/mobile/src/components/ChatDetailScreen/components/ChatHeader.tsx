import IconButton from '../../IconButton'
import {Stack, XStack} from 'tamagui'
import OtherSideNamePhotoAndInfo from './OtherSideNamePhotoAndInfo'
import blockIconSvg from '../../../images/blockIconSvg'
import backButtonSvg from '../../../images/backButtonSvg'
import identityIconSvg from '../images/identityIconSvg'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {Keyboard, TouchableOpacity} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useSetAtom} from 'jotai'
import binSvg from '../images/binSvg'
import {enableHiddenFeatures} from '../../../utils/environment'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import {useCallback} from 'react'

type ButtonType =
  | 'back'
  | 'identityReveal'
  | 'block'
  | 'closeModal'
  | 'deleteChat'
  | null

function Button({type}: {type: ButtonType}): JSX.Element | null {
  const safeGoBack = useSafeGoBack()
  const {
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
  } = useMolecule(chatMolecule)
  const setModal = useSetAtom(showModalAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()

  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)

  if (type === 'back')
    return (
      <IconButton
        icon={backButtonSvg}
        variant={'primary'}
        onPress={safeGoBack}
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

  if (type === 'identityReveal' && enableHiddenFeatures)
    return (
      <IconButton
        icon={identityIconSvg}
        variant={'primary'}
        onPress={() => {
          console.log('todo')
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

  if (type === 'deleteChat') {
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
  }

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
