import TextInput from '../../Input'
import IconButton from '../../IconButton'
import sendSvg from '../images/sendSvg'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import {StyleSheet} from 'react-native'
import React, {useCallback, useState} from 'react'
import Animated, {useAnimatedStyle, withSpring} from 'react-native-reanimated'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import truncate from 'just-truncate'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CancelSvg from '../images/cancelSvg'
import Image from '../../Image'

const styles = StyleSheet.create({
  textInput: {
    paddingTop: 5,
    paddingBottom: getTokens().space[2].val,
    paddingLeft: getTokens().space[3].val,
    paddingRight: getTokens().space[2].val,
  },
})

function ChatTextInput(): JSX.Element | null {
  const [value, setValue] = useState('')
  const {sendMessageAtom, replyToMessageAtom, otherSideDataAtom} =
    useMolecule(chatMolecule)
  const [replyToMessage, setReplyToMessage] = useAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const sendMessage = useSetAtom(sendMessageAtom)
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()

  const animatedStyle = useAnimatedStyle(() => {
    return {opacity: withSpring(value ? 1 : 0)}
  }, [value])

  const sendText = useCallback(() => {
    if (!value.trim()) return

    const message: ChatMessage = {
      text: value,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      repliedTo: replyToMessage
        ? {
            text: truncate(replyToMessage.message.text, 100, '...'),
            messageAuthor: replyToMessage.state === 'received' ? 'them' : 'me',
          }
        : undefined,
      messageType: 'MESSAGE',
      senderPublicKey: session.privateKey.publicKeyPemBase64,
    }
    setValue('')
    setReplyToMessage(null)
    void sendMessage(message)()
  }, [session, value, sendMessage, replyToMessage, setReplyToMessage])

  return (
    <Stack backgroundColor="$grey" borderRadius="$8">
      {replyToMessage && (
        <XStack
          borderRadius="$5"
          margin="$3"
          padding="$3"
          backgroundColor="$yellowAccent2"
          justifyContent={'space-between'}
        >
          <YStack f={1}>
            <Text fontSize={12} color="$main">
              {replyToMessage.state === 'received'
                ? otherSideData.userName
                : t('common.you')}
            </Text>
            <Text marginTop="$1" color="$main">
              {truncate(replyToMessage.message.text, 100, '...')}
            </Text>
          </YStack>
          <Image
            source={CancelSvg}
            onPress={() => {
              setReplyToMessage(null)
            }}
          />
        </XStack>
      )}
      <TextInput
        multiline
        value={value}
        onChangeText={setValue}
        style={styles.textInput}
        textColor={'$white'}
        variant={'greyOnBlack'}
        borderRadius={'$8'}
        placeholder={t('messages.typeSomething')}
        placeholderTextColor={getTokens().color.greyOnBlack.val}
        rightElement={
          <Animated.View style={animatedStyle}>
            <IconButton
              oval
              variant="secondary"
              icon={sendSvg}
              onPress={sendText}
            />
          </Animated.View>
        }
      />
    </Stack>
  )
}

export default ChatTextInput
