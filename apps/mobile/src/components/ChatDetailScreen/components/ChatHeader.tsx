import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Keyboard, TouchableOpacity} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import backButtonSvg from '../../../images/backButtonSvg'
import blockIconSvg from '../../../images/blockIconSvg'
import tradeChecklistSvg from '../../../images/tradeChecklistSvg'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import IconButton from '../../IconButton'
import identityIconSvg from '../../images/identityIconSvg'
import {chatMolecule} from '../atoms'
import phoneSvg from '../images/phoneSvg'
import useOpenTradeChecklistReveal from '../utils/useOpenTradeChecklistReveal'
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

function Button({type}: {type: ButtonType}): React.ReactElement | null {
  const safeGoBack = useSafeGoBack()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    showModalAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    forceShowHistoryAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    otherSideSupportsTradingChecklistAtom,
    listingTypeIsOtherAtom,
  } = useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const setModal = useSetAtom(showModalAtom)
  const openTradeChecklistReveal = useOpenTradeChecklistReveal()
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)
  const canUseTradingChecklist =
    !!otherSideSupportsTradingChecklist && !listingTypeIsOther

  const blockChat = useSetAtom(blockChatWithUiFeedbackAtom)
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)

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
        icon={require('./images/trashIconRed.png')}
        variant="negative"
        onPress={() => {
          Keyboard.dismiss()
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((success) => {
              if (success) {
                resetNavigationToMessagingScreen()
              }
            })(deleteChatWithUiFeedback({skipAsk: false}))
          )
        }}
      />
    )

  if (
    type === 'identityReveal' &&
    identityRevealStatus === 'notStarted' &&
    canUseTradingChecklist
  )
    return (
      <IconButton
        icon={identityIconSvg}
        variant="primary"
        onPress={() => {
          openTradeChecklistReveal({
            item: 'REVEAL_IDENTITY',
            intent: 'request',
          })
        }}
      />
    )

  if (
    type === 'contactReveal' &&
    identityRevealStatus === 'shared' &&
    contactRevealStatus === 'notStarted' &&
    canUseTradingChecklist
  )
    return (
      <IconButton
        icon={phoneSvg}
        iconFill={getTokens().color.main.val}
        variant="primary"
        onPress={() => {
          openTradeChecklistReveal({
            item: 'REVEAL_PHONE_NUMBER',
            intent: 'request',
          })
        }}
      />
    )

  if (type === 'tradeChecklist') {
    if (!canUseTradingChecklist) return <Stack w={40} h={40} />

    return (
      <XStack gap="$1">
        {identityRevealStatus === 'notStarted' ? (
          <IconButton
            icon={identityIconSvg}
            variant="primary"
            onPress={() => {
              openTradeChecklistReveal({
                item: 'REVEAL_IDENTITY',
                intent: 'request',
              })
            }}
          />
        ) : null}
        {identityRevealStatus === 'shared' &&
        contactRevealStatus === 'notStarted' ? (
          <IconButton
            icon={phoneSvg}
            iconFill={getTokens().color.main.val}
            variant="primary"
            onPress={() => {
              openTradeChecklistReveal({
                item: 'REVEAL_PHONE_NUMBER',
                intent: 'request',
              })
            }}
          />
        ) : null}
        <IconButton
          icon={tradeChecklistSvg}
          variant="primary"
          onPress={() => {
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
      </XStack>
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
}): React.ReactElement {
  const handleMiddlePress = useCallback(() => {
    Keyboard.dismiss()
    onPressMiddle()
  }, [onPressMiddle])
  return (
    <XStack mx="$1" mt="$4">
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
