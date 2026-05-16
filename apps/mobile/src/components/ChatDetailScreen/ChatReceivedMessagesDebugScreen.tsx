import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  ArrowLeft,
  Button,
  NavigationBar,
  Screen,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Array, Order, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Text as RNText, ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, getTokens, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import {useStatusBarStyleForScreen} from '../../state/statusBarStyleAtom'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {ChatScope, chatMolecule} from './atoms'

const jsonTextStyle = {
  fontFamily: 'monospace',
  fontSize: getTokens().size.$3.val,
}

function ChatReceivedMessagesDebugContent({
  chatExists,
  inboxKey,
  otherSideKey,
}: {
  readonly chatExists: boolean
  readonly inboxKey: Props['route']['params']['inboxKey']
  readonly otherSideKey: Props['route']['params']['otherSideKey']
}): React.ReactElement {
  useStatusBarStyleForScreen('secondary')

  const {bottom} = useSafeAreaInsets()
  const theme = useTheme()
  const navigation =
    useNavigation<
      RootStackScreenProps<'ChatReceivedMessagesDebug'>['navigation']
    >()
  const {t} = useTranslation()
  const {messagesAtom} = useMolecule(chatMolecule)
  const messages = useAtomValue(messagesAtom)
  const safeGoBack = useSafeGoBack()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const messagesToDisplay = pipe(
    messages,
    Array.filter(
      (message) =>
        message.state === 'received' ||
        message.state === 'receivedButRequiresNewerVersion' ||
        message.state === 'sending' ||
        message.state === 'sent' ||
        message.state === 'sendingError'
    ),
    Array.sortBy(
      Order.mapInput(Order.number, (message) => message.message.time)
    )
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Messages JSON"
          rightActions={[]}
          leftAction={{
            icon: ArrowLeft,
            onPress: safeGoBack,
          }}
        />
      }
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: getTokens().space.$5.val,
          paddingTop: getTokens().space.$5.val,
          paddingBottom: bottom + getTokens().space.$8.val,
        }}
      >
        {!chatExists ? (
          <Typography color="$foregroundPrimary" variant="paragraph">
            Chat not found.
          </Typography>
        ) : (
          <YStack gap="$4">
            <Button
              width="100%"
              size="small"
              variant="secondary"
              onPress={() => {
                navigation.navigate('ChatInfoJsonDebug', {
                  inboxKey,
                  otherSideKey,
                })
              }}
            >
              Chat info JSON
            </Button>
            <Typography color="$foregroundSecondary" variant="paragraph">
              Showing {messagesToDisplay.length} message
              {messagesToDisplay.length === 1 ? '' : 's'} for this chat.
            </Typography>
            {pipe(
              messagesToDisplay,
              Array.map((message, index) => {
                const messageJson = JSON.stringify(message, null, 2)
                const directionPrefix =
                  message.state === 'received' ||
                  message.state === 'receivedButRequiresNewerVersion'
                    ? 'RECEIVED'
                    : 'SEND'
                const messageDescription = `${directionPrefix} ${message.message.messageType} ${
                  message.message.text ?? ''
                }`

                return (
                  <YStack
                    key={message.message.uuid}
                    backgroundColor="$backgroundSecondary"
                    borderRadius="$5"
                    padding="$4"
                    gap="$4"
                  >
                    <Typography
                      color="$foregroundSecondary"
                      variant="paragraph"
                    >
                      {messageDescription}
                    </Typography>
                    <Stack
                      backgroundColor="$backgroundTertiary"
                      borderRadius="$4"
                      padding="$3"
                    >
                      <RNText
                        selectable
                        style={[
                          jsonTextStyle,
                          {color: theme.foregroundPrimary.get()},
                        ]}
                      >
                        {messageJson}
                      </RNText>
                    </Stack>
                    <Button
                      width="100%"
                      size="small"
                      variant="secondary"
                      onPress={() => {
                        Clipboard.setString(messageJson)
                        setToastNotification(t('common.copied'))
                      }}
                    >
                      Copy
                    </Button>
                  </YStack>
                )
              })
            )}
          </YStack>
        )}
      </ScrollView>
    </Screen>
  )
}

type Props = RootStackScreenProps<'ChatReceivedMessagesDebug'>

export default function ChatReceivedMessagesDebugScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
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

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <ChatReceivedMessagesDebugContent
        chatExists={chatExists}
        inboxKey={inboxKey}
        otherSideKey={otherSideKey}
      />
    </ScopeProvider>
  )
}
