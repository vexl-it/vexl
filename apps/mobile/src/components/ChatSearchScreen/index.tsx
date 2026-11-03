import {
  ArrowLeft,
  Divider,
  EmptyState,
  NavigationBar,
  Screen,
  SearchBar,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {atom, useAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ChatSearchChatResultItem from './components/ChatSearchChatResultItem'
import ChatSearchMessageResultItem from './components/ChatSearchMessageResultItem'
import {useChatSearchResults} from './state'

// Non-virtualized scrolling is intentional here.
// Search results are already filtered down from the full chat/message dataset,
// so the rendered list is usually modest. In this screen the heavier work is
// local filtering and match highlighting, not list virtualization. FlashList
// would add complexity for sections/dividers with limited practical gain unless
// this screen starts showing very large result sets or real-device jank.

function ChatSearchScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const queryAtom = useMemo(() => atom(''), [])
  const [query, setQuery] = useAtom(queryAtom)
  const trimmedQuery = query.trim()
  const {chats, messages} = useChatSearchResults({query, t})
  const hasResults = chats.length > 0 || messages.length > 0
  const showEmptyState = trimmedQuery !== '' && !hasResults

  useEffect(() => {
    return () => {
      setQuery('')
    }
  }, [setQuery])

  return (
    <Screen
      scrollable
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={t('messages.search.title')}
          leftAction={{
            icon: ArrowLeft,
            onPress: safeGoBack,
          }}
        />
      }
    >
      <YStack f={1} pt="$2">
        <YStack px="$5">
          <SearchBar
            valueAtom={queryAtom}
            autoFocus
            placeholder={t('messages.search.placeholder')}
          />
        </YStack>
        <YStack f={1} pt="$5" pb="$5">
          {trimmedQuery !== '' && chats.length > 0 ? (
            <YStack gap="$2" mb="$5" px="$5">
              <Typography color="$foregroundPrimary" variant="titlesSmall">
                {t('messages.search.sections.chats')}
              </Typography>
              {chats.map((one) => (
                <ChatSearchChatResultItem
                  key={one.chat.id}
                  result={one}
                  query={trimmedQuery}
                />
              ))}
            </YStack>
          ) : null}

          {trimmedQuery !== '' && messages.length > 0 ? (
            <YStack gap="$2" px="$5">
              <Typography color="$foregroundPrimary" variant="titlesSmall">
                {t('messages.search.sections.messages')}
              </Typography>
              {messages.map((one, index) => (
                <YStack key={one.messageId}>
                  {index > 0 ? <Divider mt="$4" mb="$5" /> : null}
                  <ChatSearchMessageResultItem
                    result={one}
                    query={trimmedQuery}
                  />
                </YStack>
              ))}
            </YStack>
          ) : null}

          {showEmptyState ? (
            <EmptyState
              px="$5"
              title={t('messages.search.empty.title')}
              description={t('messages.search.empty.subtitle')}
            />
          ) : null}
        </YStack>
      </YStack>
    </Screen>
  )
}

export default ChatSearchScreen
