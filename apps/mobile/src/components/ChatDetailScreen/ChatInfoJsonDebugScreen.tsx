import Clipboard from '@react-native-clipboard/clipboard'
import {
  ArrowLeft,
  Button,
  NavigationBar,
  Screen,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
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

function ChatInfoJsonDebugContent({
  chatExists,
}: {
  readonly chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('secondary')

  const {bottom} = useSafeAreaInsets()
  const theme = useTheme()
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {chatAtom} = useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const chatJson = JSON.stringify(chat, null, 2)

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Chat info JSON"
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
            <Typography color="$foregroundSecondary" variant="paragraph">
              CHAT INFO
            </Typography>
            <Stack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$4"
              gap="$4"
            >
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
                  {chatJson}
                </RNText>
              </Stack>
              <Button
                width="100%"
                size="small"
                variant="secondary"
                onPress={() => {
                  Clipboard.setString(chatJson)
                  setToastNotification(t('common.copied'))
                }}
              >
                Copy
              </Button>
            </Stack>
          </YStack>
        )}
      </ScrollView>
    </Screen>
  )
}

type Props = RootStackScreenProps<'ChatInfoJsonDebug'>

export default function ChatInfoJsonDebugScreen({
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
      <ChatInfoJsonDebugContent chatExists={chatExists} />
    </ScopeProvider>
  )
}
