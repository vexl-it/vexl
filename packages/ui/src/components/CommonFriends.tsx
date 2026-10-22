import {Array, pipe} from 'effect'
import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons'
import {Stack, XStack, YStack} from '../primitives'
import {Chip} from './Chip'
import {Typography} from './Typography'

export interface CommonFriend {
  readonly id: string
  readonly trusted?: boolean
  readonly name: string
  readonly avatarSource?: RNImageProps['source']
}

export interface CommonFriendsProps {
  readonly label: string
  readonly trustedLabel?: string
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

export function CommonFriends({
  label,
  trustedLabel,
  friends,
  onPress,
}: CommonFriendsProps): React.JSX.Element {
  const theme = useTheme()

  const bgColor = theme.backgroundSecondary.get()
  const chevronColor = theme.foregroundSecondary.get()

  const gradientWidth = getTokens().size.$12.val
  const gap = getTokens().space.$3.val

  return (
    <CommonFriendsFrame onPress={onPress}>
      <YStack px="$5" py="$4" gap="$3">
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          letterSpacing={0}
        >
          {trustedLabel ? `${label} · ${trustedLabel}` : label}
        </Typography>
        <XStack gap={gap} alignItems="center" overflow="hidden">
          {pipe(
            friends,
            Array.map((friend) => (
              <Chip
                key={friend.id}
                name={friend.name}
                trusted={friend.trusted}
                avatarSource={friend.avatarSource}
              />
            ))
          )}
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
