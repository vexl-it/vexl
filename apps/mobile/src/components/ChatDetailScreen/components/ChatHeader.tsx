import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Alert, Keyboard, TouchableOpacity} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import backButtonSvg from '../../../images/backButtonSvg'
import blockIconSvg from '../../../images/blockIconSvg'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import IconButton from '../../IconButton'
import identityIconSvg from '../../images/identityIconSvg'
import {chatMolecule} from '../atoms'
import binSvg from '../images/binSvg'
import phoneSvg from '../images/phoneSvg'
import OtherSideNamePhotoAndInfo from './OtherSideNamePhotoAndInfo'

type ButtonType =
  | 'back'
  | 'closeModal'
  | 'deleteChat'
  | 'block'
  | 'tradeChecklist'
  | 'identityReveal'
  | 'contactReveal'
  | null

function Button({type}: {type: ButtonType}): JSX.Element | null {
  const safeGoBack = useSafeGoBack()
  const navigation = useNavigation()
  const {t} = useTranslation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    forceShowHistoryAtom,
    identityRevealStatusAtom,
    revealIdentityWithUiFeedbackAtom,
    revealContactWithUiFeedbackAtom,
    contactRevealStatusAtom,
    otherSideSupportsTradingChecklistAtom,
  } = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const setModal = useSetAtom(showModalAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )

  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)

  const [forceShowHistory, setForceShowHistory] = useAtom(forceShowHistoryAtom)

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
        variant="primary"
        onPress={onGoBackPressed}
      />
    )

  if (type === 'closeModal')
    return (
      <IconButton
        icon={backButtonSvg}
        variant="primary"
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
        variant="negative"
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
        variant="negative"
        onPress={() => {
          Keyboard.dismiss()
          void deleteChat().then((success) => {
            if (success) {
              resetNavigationToMessagingScreen()
            }
          })
        }}
      />
    )

  if (type === 'identityReveal' && identityRevealStatus === 'notStarted')
    return (
      <IconButton
        icon={identityIconSvg}
        variant="primary"
        onPress={() => {
          void revealIdentity('REQUEST_REVEAL')
        }}
      />
    )

  if (
    type === 'contactReveal' &&
    identityRevealStatus === 'shared' &&
    contactRevealStatus === 'notStarted'
  )
    return (
      <IconButton
        icon={phoneSvg}
        iconFill={getTokens().color.main.val}
        variant="primary"
        onPress={() => {
          void revealContact('REQUEST_REVEAL')
        }}
      />
    )

  if (type === 'tradeChecklist')
    return (
      <XStack space="$1">
        {identityRevealStatus === 'notStarted' && (
          <IconButton
            icon={identityIconSvg}
            variant="primary"
            onPress={() => {
              void revealIdentity('REQUEST_REVEAL')
            }}
          />
        )}
        {identityRevealStatus === 'shared' &&
          contactRevealStatus === 'notStarted' && (
            <IconButton
              icon={phoneSvg}
              iconFill={getTokens().color.main.val}
              variant="primary"
              onPress={() => {
                void revealContact('REQUEST_REVEAL')
              }}
            />
          )}
        {!!otherSideSupportsTradingChecklist && (
          <IconButton
            icon={tradeChecklistSvg}
            variant="primary"
            onPress={() => {
              if (!otherSideSupportsTradingChecklist) {
                Alert.alert(
                  t('tradeChecklist.notSupportedByOtherSide.title'),
                  t('tradeChecklist.notSupportedByOtherSide.body')
                )
                return
              }
              Keyboard.dismiss()
              setModal(false)
              navigation.navigate('TradeChecklistFlow', {
                screen: 'AgreeOnTradeDetails',
                chatId,
                inboxKey,
              })
            }}
            iconFill={getTokens().color.main.val}
            iconHeight={24}
            iconWidth={24}
          />
        )}
      </XStack>
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
    <XStack mx="$4" mt="$4">
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
