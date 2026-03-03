import React, {useMemo} from 'react'
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons'
import {SizableText, Stack, XStack, YStack} from '../primitives'

export interface CommonFriend {
  readonly name: string
  readonly avatar: React.ReactNode
}

export interface CommonFriendsProps {
  readonly label: string
  readonly friends: readonly CommonFriend[]
  readonly onPress?: () => void
}

const CommonFriendsFrame = styled(Stack, {
  name: 'CommonFriendsFrame',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  overflow: 'hidden',
  pressStyle: {
    opacity: 0.7,
  },
})

const FriendChipFrame = styled(XStack, {
  name: 'FriendChipFrame',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$2',
  padding: '$2',
  gap: '$2',
  alignItems: 'center',
  overflow: 'hidden',
  flexShrink: 0,
})

export function CommonFriends({
  label,
  friends,
  onPress,
}: CommonFriendsProps): React.JSX.Element {
  const theme = useTheme()

  const bgColor = useMemo(() => theme.backgroundSecondary.val, [theme])
  const chevronColor = useMemo(() => theme.foregroundSecondary.val, [theme])

  const gradientWidth = useMemo(() => getTokens().size.$12.val, [])
  const gap = useMemo(() => getTokens().space.$3.val, [])

  return (
    <CommonFriendsFrame onPress={onPress}>
      <YStack paddingLeft="$5" paddingVertical="$4" gap="$3">
        <SizableText
          fontFamily="$body"
          fontSize="$1"
          fontWeight="500"
          color="$foregroundSecondary"
        >
          {label}
        </SizableText>
        <XStack gap={gap} alignItems="center" overflow="hidden">
          {friends.map((friend, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <FriendChipFrame key={index}>
              <Stack
                width="$5"
                height="$5"
                borderRadius="$2"
                overflow="hidden"
              >
                {friend.avatar}
              </Stack>
              <SizableText
                fontFamily="$body"
                fontSize="$1"
                fontWeight="500"
                color="$foregroundSecondary"
                numberOfLines={1}
              >
                {friend.name}
              </SizableText>
            </FriendChipFrame>
          ))}
        </XStack>
      </YStack>
      <Stack
        position="absolute"
        top={0}
        bottom={0}
        right={0}
        width={gradientWidth}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <SvgLinearGradient
              id="commonFriendsFade"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <Stop offset="0" stopColor={bgColor} stopOpacity="0" />
              <Stop offset="0.4" stopColor={bgColor} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#commonFriendsFade)" />
        </Svg>
      </Stack>
      <Stack
        position="absolute"
        right="$3"
        top={0}
        bottom={0}
        justifyContent="center"
        pointerEvents="none"
      >
        <ChevronRight size={24} color={chevronColor} />
      </Stack>
    </CommonFriendsFrame>
  )
}
