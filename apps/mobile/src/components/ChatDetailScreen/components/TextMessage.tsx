import {Stack, Text} from 'tamagui'
import React, {useCallback} from 'react'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import {chatTime, type MessagesListItem} from '../utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {Pressable} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

function TextMessage({
  messageAtom,
}: {
  messageAtom: Atom<MessagesListItem>
}): JSX.Element | null {
  const messageItem = useAtomValue(messageAtom)
  const {sendMessageAtom} = useMolecule(chatMolecule)
  const sendMessage = useSetAtom(sendMessageAtom)
  const {t} = useTranslation()

  const onPressResend = useCallback(() => {
    if (
      messageItem.type === 'message' &&
      messageItem.message.state === 'sendingError'
    ) {
      void sendMessage({
        ...messageItem.message.message,
        time: unixMillisecondsNow(),
      })()
    }
  }, [sendMessage, messageItem])

  if (messageItem.type !== 'message') return null
  const {message, isLatest, time} = messageItem

  if (!message) return null

  const isMine = message.state !== 'received'

  return (
    <Stack
      mx={'$4'}
      mt={'$1'}
      pl={isMine ? '$5' : 0}
      pr={!isMine ? '$5' : 0}
      alignItems={isMine ? 'flex-end' : 'flex-start'}
    >
      <Stack br={'$6'} backgroundColor={isMine ? '$main' : '$grey'} p={'$4'}>
        <Text
          fos={16}
          fontFamily={'$body500'}
          color={isMine ? '$black' : '$white'}
        >
          {message.message.text}
        </Text>
      </Stack>
      {message.state === 'sendingError' && (
        <Pressable onPress={onPressResend}>
          <Text
            textAlign={isMine ? 'right' : 'left'}
            mt="$1"
            mb="$2"
            color={message.state === 'sendingError' ? '$red' : '$greyOnBlack'}
          >
            {toCommonErrorMessage(message.error, t) ?? t('common.unknownError')}{' '}
            {t('messages.tapToResent')}
          </Text>
        </Pressable>
      )}
      {isLatest && (
        <Text
          textAlign={isMine ? 'right' : 'left'}
          mt="$1"
          mb="$2"
          color={message.state === 'sendingError' ? '$red' : '$greyOnBlack'}
        >
          {message.state === 'sending' && t('messages.sending')}
          {(message.state === 'sent' || message.state === 'received') &&
            chatTime(time)}
        </Text>
      )}
    </Stack>
  )
}

export default TextMessage
