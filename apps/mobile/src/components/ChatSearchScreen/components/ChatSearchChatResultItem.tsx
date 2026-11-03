import {useNavigation} from '@react-navigation/native'
import {ChatMessageItem} from '@vexl-next/ui'
import React from 'react'
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
    <ChatMessageItem
      avatar={<ProfileImageAvatar image={result.avatar} size="$9" />}
      name={result.displayName}
      highlightQuery={query}
      message={result.lastMessagePreviewText}
      time={date.isValid ? <FromNowComponent date={date} /> : null}
      onPress={() => {
        navigation.navigate('ChatDetail', chatDetailRouteParams(result.chat))
      }}
    />
  )
}

export default ChatSearchChatResultItem
