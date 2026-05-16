import {Button, Screen, Stack, Typography} from '@vexl-next/ui'
import {ScopeProvider} from 'bunshi/dist/react'
import {useAtomValue, useStore} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {hideNotificationsForChat} from '../../utils/notifications/chatNotifications'
import {useOnFocusAndAppState} from '../../utils/useFocusAndAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {ChatScope} from './atoms'
import MessagesScreen from './components/MessagesScreen'

type Props = RootStackScreenProps<'ChatDetail'>

export default function ChatDetailScreen({
  route: {
    params: {otherSideKey, inboxKey, targetMessageId},
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
      <Screen navigationBar={null} noHorizontalPadding>
        <Stack gap="$5" f={1} ai="center" jc="center" mt="$6">
          <Typography color="$foregroundPrimary" variant="heading3">
            {t('common.chatNotFoundError')}
          </Typography>
          <Button
            variant="primary"
            size="large"
            onPress={() => {
              safeGoBack()
            }}
          >
            {t('common.goBack')}
          </Button>
        </Stack>
      </Screen>
    )

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <MessagesScreen targetMessageId={targetMessageId} />
    </ScopeProvider>
  )
}
