import {ScopeProvider} from 'bunshi/dist/react'
import {useAtomValue, useStore} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Stack, Text} from 'tamagui'
import backButtonSvg from '../../images/backButtonSvg'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {hideNotificationsForChat} from '../../utils/notifications/chatNotifications'
import {useOnFocusAndAppState} from '../../utils/useFocusAndAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import Screen from '../Screen'
import {ChatScope} from './atoms'
import MessagesListOrApprovalPreview from './components/MessagesListOrApprovalPreview'

type Props = RootStackScreenProps<'ChatDetail'>

export default function ChatDetailScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const store = useStore()

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
      void hideNotificationsForChat(store.get(nonNullChatWithMessagesAtom).chat)
    }, [nonNullChatWithMessagesAtom, store])
  )

  if (!chatExists)
    return (
      <Screen>
        <Stack>
          <IconButton icon={backButtonSvg} onPress={safeGoBack} />
        </Stack>
        <Stack f={1} ai="center" mt="$6">
          <Text ff="$heading" fos={16} col="$white">
            {t('common.chatNotFoundError')}
          </Text>
        </Stack>
      </Screen>
    )

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <MessagesListOrApprovalPreview />
    </ScopeProvider>
  )
}
