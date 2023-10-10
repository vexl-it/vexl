import {type RootStackScreenProps} from '../../navigationTypes'
import {ScopeProvider} from 'jotai-molecules'
import {ChatScope, dummyChatWithMessages} from './atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import focusChatWithMessagesAtom from '../../state/chat/atoms/focusChatWithMessagesAtom'
import MessagesListOrApprovalPreview from './components/MessagesListOrApprovalPreview'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import {useOnFocusAndAppState} from '../ContactListSelect/utils'
import {hideNotificationsForChatActionAtom} from '../../state/displayedNotifications'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'
import IconButton from '../IconButton'
import backButtonSvg from '../../images/backButtonSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'ChatDetail'>

export default function ChatDetailScreen({
  route: {
    params: {chatId, inboxKey},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const hideNotificationsForChat = useSetAtom(
    hideNotificationsForChatActionAtom
  )

  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesAtom({chatId, inboxKey})

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })

    const chatExistsAtom = hasNonNullableValueAtom(chatWithMessagesAtom)

    return {nonNullChatWithMessagesAtom, chatExistsAtom}
  }, [chatId, inboxKey])

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
