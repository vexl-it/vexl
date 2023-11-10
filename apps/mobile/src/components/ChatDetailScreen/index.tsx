import {useAtomValue, useSetAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import React, {useCallback, useMemo} from 'react'
import {Stack, Text} from 'tamagui'
import backButtonSvg from '../../images/backButtonSvg'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {hideNotificationsForChatActionAtom} from '../../state/displayedNotifications'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useOnFocusAndAppState} from '../ContactListSelect/utils'
import IconButton from '../IconButton'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import {ChatScope, dummyChatWithMessages} from './atoms'
import MessagesListOrApprovalPreview from './components/MessagesListOrApprovalPreview'

type Props = RootStackScreenProps<'ChatDetail'>

export default function ChatDetailScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const hideNotificationsForChat = useSetAtom(
    hideNotificationsForChatActionAtom
  )

  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesByKeysAtom({
      otherSideKey,
      inboxKey,
    })

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })

    const chatExistsAtom = hasNonNullableValueAtom(chatWithMessagesAtom)

    return {nonNullChatWithMessagesAtom, chatExistsAtom}
  }, [inboxKey, otherSideKey])

  const chatExists = useAtomValue(chatExistsAtom)

  useOnFocusAndAppState(
    useCallback(() => {
      hideNotificationsForChat(nonNullChatWithMessagesAtom)
    }, [hideNotificationsForChat, nonNullChatWithMessagesAtom])
  )

  if (!chatExists)
    return (
      <Screen>
        <Stack>
          <IconButton icon={backButtonSvg} onPress={safeGoBack} />
        </Stack>
        <Stack f={1} ai={'center'} mt={'$6'}>
          <Text ff={'$heading'} fos={16} col={'$white'}>
            {t('common.chatNotFoundError')}
          </Text>
        </Stack>
      </Screen>
    )

  return (
    <KeyboardAvoidingView>
      <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
        <MessagesListOrApprovalPreview />
      </ScopeProvider>
    </KeyboardAvoidingView>
  )
}
