import IconButton from '../../IconButton'
import {Stack, XStack} from 'tamagui'
import OtherSideNamePhotoAndInfo from './OtherSideNamePhotoAndInfo'
import blockIconSvg from '../../../images/blockIconSvg'
import backButtonSvg from '../../../images/backButtonSvg'
import identityIconSvg from '../../images/identityIconSvg'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {Keyboard, TouchableOpacity} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import binSvg from '../images/binSvg'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import {useCallback} from 'react'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'
import {useReportOfferHandleUI} from '../../OfferDetailScreen/api'

type ButtonType =
  | 'back'
  | 'identityReveal'
  | 'block'
  | 'closeModal'
  | 'deleteChat'
  | 'reportOffer'
  | null

function Button({type}: {type: ButtonType}): JSX.Element | null {
  const safeGoBack = useSafeGoBack()
  const {
    offerForChatAtom,
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    identityRevealStatusAtom,
    revealIdentityWithUiFeedbackAtom,
  } = useMolecule(chatMolecule)
  const setModal = useSetAtom(showModalAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const reportOffer = useReportOfferHandleUI()

  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const offerForChat = useAtomValue(offerForChatAtom)

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

  if (type === 'identityReveal' && identityRevealStatus === 'notStarted')
    return (
      <IconButton
        icon={identityIconSvg}
        variant={'primary'}
        onPress={() => {
          void revealIdentity('REQUEST_REVEAL')
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

  if (type === 'reportOffer' && offerForChat)
    return (
      <Stack mr={'$2'}>
        <IconButton
          icon={flagSvg}
          variant={'dark'}
          onPress={() => {
            void reportOffer(offerForChat.offerInfo.offerId)()
          }}
        />
      </Stack>
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
  const {theirOfferAndNotReportedAtom} = useMolecule(chatMolecule)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)

  const handleMiddlePress = useCallback(() => {
    Keyboard.dismiss()
    onPressMiddle()
  }, [onPressMiddle])
  return (
    <XStack mx={'$4'} mt={'$4'}>
      <Button type={leftButton} />
      {theirOfferAndNotReported && <Button type={null} />}

      <Stack f={1} mx={mode === 'photoLeft' ? '$2' : 0}>
        <TouchableOpacity onPress={handleMiddlePress}>
          <OtherSideNamePhotoAndInfo mode={mode} />
        </TouchableOpacity>
      </Stack>

      {theirOfferAndNotReported && <Button type={'reportOffer'} />}
      <Button type={rightButton} />
    </XStack>
  )
}

export default ChatHeader
