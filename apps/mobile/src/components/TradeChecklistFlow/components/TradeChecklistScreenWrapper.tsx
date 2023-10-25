import {getTokens, Stack} from 'tamagui'
import Screen from '../../Screen'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import {ScopeProvider} from 'jotai-molecules'
import {ChatScope, dummyChatWithMessages} from '../../ChatDetailScreen/atoms'
import {useMemo} from 'react'
import focusChatWithMessagesAtom from '../../../state/chat/atoms/focusChatWithMessagesAtom'
import valueOrDefaultAtom from '../../../utils/atomUtils/valueOrDefaultAtom'
import {type ChatId} from '@vexl-next/domain/dist/general/messaging'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

interface Props {
  chatId: ChatId
  inboxKey: PublicKeyPemBase64
  children: JSX.Element | JSX.Element[]
}

function TradeChecklistScreenWrapper({
  chatId,
  children,
  inboxKey,
}: Props): JSX.Element {
  const {bottom} = useSafeAreaInsets()

  const nonNullChatWithMessagesAtom = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesAtom({chatId, inboxKey})

    return valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })
  }, [chatId, inboxKey])

  return (
    <KeyboardAvoidingView>
      <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
        <Stack f={1}>
          <Stack h={100} bc={'$grey'} opacity={0.45} />
          <Screen pt={'$4'} customHorizontalPadding={getTokens().space[2].val}>
            <Stack
              width={36}
              h={5}
              als={'center'}
              bc={'$greyAccent1'}
              br={'$5'}
              mb={'$4'}
            />
            <ScrollView
              style={{marginBottom: bottom}}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Screen>
        </Stack>
      </ScopeProvider>
    </KeyboardAvoidingView>
  )
}

export default TradeChecklistScreenWrapper
