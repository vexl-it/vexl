import {useNavigation} from '@react-navigation/native'
import {
  ChevronLeft,
  FlagReport,
  ListWriteDocument,
  NavButton,
  PhoneCall,
  Stack,
  IconButton as UiIconButton,
  UserProfile,
  XStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Alert, Keyboard, TouchableOpacity} from 'react-native'
import {useTheme} from 'tamagui'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {chatMolecule} from '../atoms'
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
  const {t} = useTranslation()
  const theme = useTheme()
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
    listingTypeIsOtherAtom,
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
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)

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
    return <NavButton icon={ChevronLeft} onPress={onGoBackPressed} />

  if (type === 'closeModal')
    return (
      <NavButton
        icon={ChevronLeft}
        onPress={() => {
          Keyboard.dismiss()
          setModal(false)
        }}
      />
    )

  if (type === 'block')
    return (
      <NavButton
        icon={FlagReport}
        variant="destructive"
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
      <NavButton
        icon={FlagReport}
        variant="destructive"
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

  if (type === 'identityReveal' && identityRevealStatus === 'notStarted')
    return (
      <UiIconButton
        onPress={() => {
          Keyboard.dismiss()
          void revealIdentity('REQUEST_REVEAL')
        }}
      >
        <UserProfile size={22} color={theme.accentHighlightSecondary.val} />
      </UiIconButton>
    )

  if (
    type === 'contactReveal' &&
    identityRevealStatus === 'shared' &&
    contactRevealStatus === 'notStarted'
  )
    return (
      <UiIconButton
        onPress={() => {
          Keyboard.dismiss()
          void revealContact('REQUEST_REVEAL')
        }}
      >
        <PhoneCall size={22} color={theme.accentHighlightSecondary.val} />
      </UiIconButton>
    )

  if (type === 'tradeChecklist')
    return (
      <XStack gap="$1">
        {identityRevealStatus === 'notStarted' && (
          <UiIconButton
            onPress={() => {
              Keyboard.dismiss()
              void revealIdentity('REQUEST_REVEAL')
            }}
          >
            <UserProfile size={22} color={theme.accentHighlightSecondary.val} />
          </UiIconButton>
        )}
        {identityRevealStatus === 'shared' &&
          contactRevealStatus === 'notStarted' && (
            <UiIconButton
              onPress={() => {
                Keyboard.dismiss()
                void revealContact('REQUEST_REVEAL')
              }}
            >
              <PhoneCall size={22} color={theme.accentHighlightSecondary.val} />
            </UiIconButton>
          )}
        {!!otherSideSupportsTradingChecklist && !listingTypeIsOther && (
          <UiIconButton
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
          >
            <ListWriteDocument
              size={22}
              color={theme.accentHighlightSecondary.val}
            />
          </UiIconButton>
        )}
      </XStack>
    )

  return <Stack width="$9" height="$9" />
}

export default function ChatHeader({
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
    <XStack
      px="$4"
      pt="$4"
      pb="$3"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$backgroundPrimary"
      backgroundColor="$backgroundSecondary"
    >
      <Button type={leftButton} />
      <Stack flex={1} mx={mode === 'photoLeft' ? '$3' : 0}>
        <TouchableOpacity onPress={handleMiddlePress}>
          <OtherSideNamePhotoAndInfo mode={mode} />
        </TouchableOpacity>
      </Stack>

      <Button type={rightButton} />
    </XStack>
  )
}
