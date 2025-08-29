import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import Image from '../../../../Image'
import trashIconSvg from '../../SettingsScreen/images/trashIconSvg'

function ChatListItemRightSwipeActions(
  props: TouchableOpacityProps
): React.ReactElement {
  return (
    <TouchableOpacity {...props}>
      <Stack w={80} h={48} bc="$grey" als="center" ai="center" jc="center">
        <Image
          width={32}
          height={32}
          stroke={getTokens().color.white.val}
          fill={getTokens().color.white.val}
          source={trashIconSvg}
        />
      </Stack>
    </TouchableOpacity>
  )
}

export default ChatListItemRightSwipeActions
