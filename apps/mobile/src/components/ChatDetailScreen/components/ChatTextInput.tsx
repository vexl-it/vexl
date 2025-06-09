import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import truncate from 'just-truncate'
import React, {useCallback, useMemo, useState} from 'react'
import {Dimensions, StyleSheet} from 'react-native'
import Animated, {useAnimatedStyle, withSpring} from 'react-native-reanimated'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {preferencesAtom} from '../../../utils/preferences'
import IconButton from '../../IconButton'
import Image from '../../Image'
import TextInput from '../../Input'
import UriImageWithSizeLimits from '../../UriImageWithSizeLimits'
import {chatMolecule} from '../atoms'
import CancelSvg from '../images/cancelSvg'
import sendSvg from '../images/sendSvg'
import SendImageButton from './SendImageButton'

const styles = StyleSheet.create({
  textInput: {
    minHeight: 55,
    maxHeight: 110,
    paddingVertical: getTokens().size[2].val,
  },
})

const responseImagePreviewLimits = {width: 200, height: 100}

function ChatTextInput(): JSX.Element | null {
  const tokens = getTokens()
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
  const checkNotificationsAndAskIfPossible = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleTEActionAtom
  )

  const preferences = useAtomValue(preferencesAtom)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      marginRight: 5,
      opacity: withSpring(value || selectedImage ? 1 : 0),
    }
  }, [value, selectedImage])

  const sendText = useCallback(() => {
    if (!value.trim() && !selectedImage) return

    const message: ChatMessage = {
      text: value,
      myVersion: version,
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

    void sendMessage(message)
    void checkNotificationsAndAskIfPossible()()
  }, [
    value,
    selectedImage,
    replyToMessage,
    session.privateKey.publicKeyPemBase64,
    setReplyToMessage,
    setSelectedImage,
    sendMessage,
    checkNotificationsAndAskIfPossible,
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
    <XStack gap="$2" alignItems="center">
      {!!preferences.allowSendingImages && <SendImageButton />}
      <Stack f={1}>
        {!!replyToMessage && (
          <XStack
            borderRadius="$5"
            margin="$3"
            padding="$3"
            backgroundColor="$yellowAccent2"
            justifyContent="space-between"
          >
            <YStack f={1}>
              {!!replyToMessage.message.image && (
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
              <Text fos={14} marginTop="$1" color="$main">
                {truncate(replyToMessage.message.text, 100, '...')}
              </Text>
            </YStack>
            <Image
              source={CancelSvg}
              stroke={getTokens().color.main.val}
              onPress={onExtraClearPressed}
            />
          </XStack>
        )}
        {!!selectedImage && (
          <YStack
            borderRadius="$5"
            margin="$3"
            padding="$3"
            backgroundColor="$yellowAccent2"
            gap="$2"
            alignItems="flex-start"
          >
            <XStack alignSelf="stretch" justifyContent="space-between">
              <Text color="$main">{t('messages.imageToSend')}</Text>
              <Image
                stroke={getTokens().color.main.val}
                source={CancelSvg}
                onPress={onExtraClearPressed}
              />
            </XStack>
            <UriImageWithSizeLimits
              uri={selectedImage.uri}
              limits={imagePreviewLimits}
            />
          </YStack>
        )}
        <Stack pt="$1">
          <TextInput
            tag="textarea"
            value={value}
            onChangeText={setValue}
            style={styles.textInput}
            textColor="$white"
            variant="greyOnBlack"
            placeholder={t('messages.typeSomething')}
            placeholderTextColor={getTokens().color.greyOnBlack.val}
            multiline
            rightElement={
              <Animated.View style={animatedStyle}>
                <IconButton
                  oval
                  variant="secondary"
                  icon={sendSvg}
                  iconFill={tokens.color.black.val}
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
