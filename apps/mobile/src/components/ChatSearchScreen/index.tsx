import {
  ArrowLeft,
  KeyboardAvoidingView,
  NavigationBar,
  Screen,
  SearchBar,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {atom, useAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {ScrollView} from 'react-native'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ChatSearchChatResultItem from './components/ChatSearchChatResultItem'
import ChatSearchMessageResultItem from './components/ChatSearchMessageResultItem'
import {useChatSearchResults} from './state'

function SectionTitle({children}: {children: string}): React.ReactElement {
  return (
    <Typography color="$foregroundPrimary" variant="titlesSmall">
      {children}
    </Typography>
  )
}

// ScrollView is intentional here.
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
      <KeyboardAvoidingView>
        <YStack f={1} pt="$2">
          <YStack px="$5">
            <SearchBar
              valueAtom={queryAtom}
              autoFocus
              placeholder={t('messages.search.placeholder')}
            />
          </YStack>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 24,
              paddingBottom: 24,
            }}
          >
            {trimmedQuery !== '' && chats.length > 0 ? (
              <YStack gap="$2" mb="$5" px="$4">
                <Stack>
                  <SectionTitle>
                    {t('messages.search.sections.chats')}
                  </SectionTitle>
                </Stack>
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
                <Stack>
                  <SectionTitle>
                    {t('messages.search.sections.messages')}
                  </SectionTitle>
                </Stack>
                {messages.map((one, index) => (
                  <YStack key={one.messageId}>
                    {index > 0 ? (
                      <Stack h={1} mt="$4" mb="$5" bg="$backgroundTertiary" />
                    ) : null}
                    <ChatSearchMessageResultItem
                      result={one}
                      query={trimmedQuery}
                    />
                  </YStack>
                ))}
              </YStack>
            ) : null}

            {showEmptyState ? (
              <YStack
                f={1}
                ai="center"
                jc="flex-start"
                px="$5"
                pt="$10"
                gap="$4"
              >
                <Typography
                  color="$foregroundPrimary"
                  variant="heading3"
                  textAlign="center"
                >
                  {t('messages.search.empty.title')}
                </Typography>
                <Typography
                  color="$foregroundSecondary"
                  variant="description"
                  textAlign="center"
                >
                  {t('messages.search.empty.subtitle')}
                </Typography>
              </YStack>
            ) : null}
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default ChatSearchScreen
