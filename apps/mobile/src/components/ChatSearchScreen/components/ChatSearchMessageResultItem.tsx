import {useNavigation} from '@react-navigation/native'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import FromNowComponent from '../../FromNowComponent'
import {type SearchMessageResult} from '../state'
import HighlightedText from './HighlightedText'

function ChatSearchMessageResultItem({
  result,
  query,
}: {
  result: SearchMessageResult
  query: string
}): React.ReactElement {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatSearch'>['navigation']>()
  const date = unixMillisecondsToLocaleDateTime(result.messageTime)

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('ChatDetail', {
          otherSideKey: result.chat.chat.otherSide.publicKey,
          inboxKey: result.chat.chat.inbox.privateKey.publicKeyPemBase64,
          targetMessageId: result.messageId,
        })
      }}
    >
      <YStack py="$4" gap="$2">
        <XStack gap="$3" ai="center">
          <Typography
            color="$foregroundPrimary"
            variant="paragraphSmall"
            f={1}
            numberOfLines={1}
          >
            {result.chat.displayName}
          </Typography>
          {date.isValid ? (
            <Typography color="$foregroundSecondary" variant="description">
              <FromNowComponent date={date} />
            </Typography>
          ) : null}
        </XStack>
        <HighlightedText
          text={result.messageText}
          query={query}
          color="$foregroundSecondary"
          variant="description"
          highlightVariant="descriptionBold"
          numberOfLines={3}
        />
      </YStack>
    </TouchableOpacity>
  )
}

export default ChatSearchMessageResultItem
