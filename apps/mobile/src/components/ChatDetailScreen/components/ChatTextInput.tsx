import TextInput from '../../Input'
import IconButton from '../../IconButton'
import sendSvg from '../images/sendSvg'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import {Dimensions, StyleSheet} from 'react-native'
import React, {useCallback, useMemo, useState} from 'react'
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
import SendImageButton from './SendImageButton'
import UriImageWithSizeLimits from '../../UriImageWithSizeLimits'
import {preferencesAtom} from '../../../utils/preferences'

const textInputInitialHeight = getTokens().space[10].val

const styles = StyleSheet.create({
  textInput: {
    padding: 0,
    paddingLeft: getTokens().space[3].val,
    paddingRight: getTokens().space[2].val,
  },
})

const responseImagePreviewLimits = {width: 200, height: 100}

function ChatTextInput(): JSX.Element | null {
  const [value, setValue] = useState('')
  const {
    sendMessageAtom,
    replyToMessageAtom,
    otherSideDataAtom,
    selectedImageAtom,
    clearExtraToSendActionAtom,
  } = useMolecule(chatMolecule)
  const [replyToMessage, setReplyToMessage] = useAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const sendMessage = useSetAtom(sendMessageAtom)
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom)
  const clearExtraToSend = useSetAtom(clearExtraToSendActionAtom)
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()

  const preferences = useAtomValue(preferencesAtom)

  const animatedStyle = useAnimatedStyle(() => {
    return {opacity: withSpring(value || selectedImage ? 1 : 0)}
  }, [value, selectedImage])

  const sendText = useCallback(() => {
    if (!value.trim() && !selectedImage) return

    const message: ChatMessage = {
      text: value,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      image: selectedImage?.uri ?? undefined,
      repliedTo: replyToMessage
        ? {
            text: truncate(replyToMessage.message.text, 100, '...'),
            messageAuthor: replyToMessage.state === 'received' ? 'them' : 'me',
            image: replyToMessage.message.image,
          }
        : undefined,
      messageType: 'MESSAGE',
      senderPublicKey: session.privateKey.publicKeyPemBase64,
    }
    setValue('')
    setReplyToMessage(undefined)
    setSelectedImage(undefined)

    void sendMessage(message)()
  }, [
    value,
    selectedImage,
    replyToMessage,
    session.privateKey.publicKeyPemBase64,
    setReplyToMessage,
    setSelectedImage,
    sendMessage,
  ])

  const imagePreviewLimits = useMemo(
    () => ({
      height: 150,
      width: Dimensions.get('screen').width * 0.7,
    }),
    []
  )

  const onExtraClearPressed = useCallback(() => {
    clearExtraToSend()
  }, [clearExtraToSend])

  return (
    <XStack space="$2" alignItems="center">
      {preferences.allowSendingImages && <SendImageButton />}
      <Stack f={1} backgroundColor="$grey" borderRadius="$8">
        {replyToMessage && (
          <XStack
            borderRadius="$5"
            margin="$3"
            padding="$3"
            backgroundColor="$yellowAccent2"
            justifyContent={'space-between'}
          >
            <YStack f={1}>
              {replyToMessage.message.image && (
                <UriImageWithSizeLimits
                  uri={replyToMessage.message.image}
                  limits={responseImagePreviewLimits}
                />
              )}
              <Text fontSize={12} color="$main">
                {replyToMessage.state === 'received'
                  ? otherSideData.userName
                  : t('common.you')}
              </Text>
              <Text marginTop="$1" color="$main">
                {truncate(replyToMessage.message.text, 100, '...')}
              </Text>
            </YStack>
            <Image source={CancelSvg} onPress={onExtraClearPressed} />
          </XStack>
        )}
        {selectedImage && (
          <YStack
            borderRadius="$5"
            margin="$3"
            padding="$3"
            backgroundColor="$yellowAccent2"
            space={'$2'}
            alignItems={'flex-start'}
          >
            <XStack alignSelf={'stretch'} justifyContent="space-between">
              <Text color={'$main'}>{t('messages.imageToSend')}</Text>
              <Image source={CancelSvg} onPress={onExtraClearPressed} />
            </XStack>
            <UriImageWithSizeLimits
              uri={selectedImage.uri}
              limits={imagePreviewLimits}
            />
          </YStack>
        )}
        <Stack
          justifyContent={'center'}
          minHeight={textInputInitialHeight}
          py={'$2'}
        >
          <TextInput
            multiline
            textAlignVertical={'center'}
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
      </Stack>
    </XStack>
  )
}

export default ChatTextInput
