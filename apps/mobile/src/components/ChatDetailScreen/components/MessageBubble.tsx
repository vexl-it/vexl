import {Stack, Typography, useTheme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {Image, StyleSheet, TouchableWithoutFeedback} from 'react-native'
import Autolink from 'react-native-autolink'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'

export const PRESSED_BUBBLE_SCALE = 0.96

const imageHeight = 300
const replyImageHeight = 50

const style = StyleSheet.create({
  image: {
    width: '100%',
    height: imageHeight,
  },
  replyImage: {
    width: '100%',
    height: replyImageHeight,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
})

function MessageBubble({
  message,
  onImagePressed,
}: {
  message: ChatMessageWithState
  onImagePressed?: () => void
}): React.ReactElement {
  const theme = useTheme()
  const isMine = message.state !== 'received'
  const messageTextColor = isMine
    ? theme.black100.get()
    : theme.foregroundPrimary.get()
  const messageBackgroundColor = isMine
    ? theme.accentYellowPrimary.get()
    : theme.backgroundTertiary.get()
  const {t} = useTranslation()
  const repliedToMessage =
    'repliedTo' in message.message ? message.message.repliedTo : undefined

  const isSpecialMessage =
    message.message.messageType === 'REQUEST_MESSAGING' ||
    message.message.messageType === 'DISAPPROVE_MESSAGING'

  return (
    <Stack>
      {!!repliedToMessage && (
        <XStack
          borderRadius="$5"
          marginBottom="$0.5"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
          backgroundColor={
            isMine ? '$accentYellowSecondary' : '$backgroundSecondary'
          }
          padding="$4"
          paddingBottom="$3"
          paddingTop="$4"
          gap="$2"
        >
          <YStack gap="$1">
            {!!repliedToMessage.image && (
              <Image
                style={style.replyImage}
                resizeMode="contain"
                source={{
                  uri: resolveLocalUri(repliedToMessage.image),
                }}
              />
            )}
            <Typography color="$foregroundSecondary" variant="micro">
              {t('common.replyTo')}
            </Typography>
            <Typography
              color="$foregroundPrimary"
              variant="micro"
              marginTop="$1"
            >
              {repliedToMessage.text}
            </Typography>
          </YStack>
        </XStack>
      )}
      {!!isSpecialMessage && (
        <XStack
          borderRadius="$5"
          marginBottom="$0.5"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
          backgroundColor={
            isMine ? '$accentYellowSecondary' : '$backgroundSecondary'
          }
          padding="$4"
          paddingBottom="$3"
          paddingTop="$4"
          gap="$2"
        >
          <Typography color="$foregroundSecondary" variant="micro">
            {message.message.messageType === 'REQUEST_MESSAGING'
              ? t('messages.requestedWith')
              : t('messages.declinedWith')}
          </Typography>
        </XStack>
      )}
      {!!message.message.image && (
        <YStack
          borderRadius="$4"
          padding="$3"
          marginBottom="$2"
          backgroundColor="$backgroundTertiary"
        >
          <TouchableWithoutFeedback
            disabled={!onImagePressed}
            onPress={onImagePressed}
          >
            <Image
              style={style.image}
              resizeMode="contain"
              source={{uri: resolveLocalUri(message.message.image)}}
            />
          </TouchableWithoutFeedback>
        </YStack>
      )}
      <Stack
        borderRadius="$6"
        borderTopLeftRadius={repliedToMessage || isSpecialMessage ? '$2' : '$6'}
        borderTopRightRadius={
          repliedToMessage || isSpecialMessage ? '$2' : '$6'
        }
        backgroundColor={messageBackgroundColor}
        px="$4"
        pb="$4"
        pt="$4"
      >
        <Autolink
          text={message.message.text}
          url
          linkStyle={[
            style.link,
            {
              color: messageTextColor,
              fontSize: 18,
              fontFamily: 'TTSatoshi500',
            },
          ]}
          style={{
            color: messageTextColor,
            fontSize: 18,
            lineHeight: 24,
            fontFamily: 'TTSatoshi500',
          }}
        />
      </Stack>
    </Stack>
  )
}

export default MessageBubble
