import {useNavigation} from '@react-navigation/native'
import {HighlightedText, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {chatDetailRouteParams} from '../../../utils/chat/goToChatDetail'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import FromNowComponent from '../../FromNowComponent'
import {ProfileImageAvatar} from '../../ProfileImageAvatar'
import {type SearchableChat} from '../state'

function ChatSearchChatResultItem({
  result,
  query,
}: {
  result: SearchableChat
  query: string
}): React.ReactElement {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatSearch'>['navigation']>()
  const date = unixMillisecondsToLocaleDateTime(result.lastMessage.message.time)

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('ChatDetail', chatDetailRouteParams(result.chat))
      }}
    >
      <XStack py="$4" gap="$4" ai="center">
        <ProfileImageAvatar image={result.avatar} size="$9" />
        <YStack f={1} gap="$1">
          <XStack gap="$3" ai="center">
            <HighlightedText
              text={result.displayName}
              query={query}
              color="$foregroundPrimary"
              variant="paragraphSmallBold"
              f={1}
              numberOfLines={1}
            />
            {date.isValid ? (
              <Typography color="$foregroundSecondary" variant="description">
                <FromNowComponent date={date} />
              </Typography>
            ) : null}
          </XStack>
          <Typography
            color="$foregroundSecondary"
            variant="description"
            numberOfLines={1}
          >
            {result.lastMessagePreviewText}
          </Typography>
        </YStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default ChatSearchChatResultItem
