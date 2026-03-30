import {useNavigation} from '@react-navigation/native'
import {Typography} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, XStack, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import unixMillisecondsToLocaleDateTime from '../../../utils/unixMillisecondsToLocaleDateTime'
import FromNowComponent from '../../FromNowComponent'
import UserAvatar from '../../UserAvatar'
import {type SearchableChat} from '../state'
import HighlightedText from './HighlightedText'

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
        navigation.navigate('ChatDetail', {
          otherSideKey: result.chat.otherSide.publicKey,
          inboxKey: result.chat.inbox.privateKey.publicKeyPemBase64,
        })
      }}
    >
      <XStack py="$4" gap="$4" ai="center">
        <Stack h="$9" w="$9">
          <UserAvatar userImage={result.avatar} width={40} height={40} />
        </Stack>
        <YStack f={1} gap="$1">
          <XStack gap="$3" ai="center">
            <HighlightedText
              text={result.displayName}
              query={query}
              color="$foregroundPrimary"
              ff="$body600"
              fos={16}
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
