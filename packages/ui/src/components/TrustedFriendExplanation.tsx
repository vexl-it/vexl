import React from 'react'
import Svg, {Polygon} from 'react-native-svg'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Stack, XStack, YStack} from '../primitives'
import {Avatar, type AvatarProps} from './Avatar'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

interface ExplanationNode {
  readonly label: string
  readonly avatar: React.ReactNode
}

export interface TrustedFriendExplanationProps {
  readonly you: ExplanationNode
  readonly trustedFriend: {
    readonly label: string
    readonly avatar: Omit<
      AvatarProps,
      'size' | 'customSize' | 'trusted' | 'trustBadgeRingColor'
    >
  }
  readonly otherSide: ExplanationNode
  readonly caption: string
  readonly commonFriendTitle: string
  readonly commonFriendDescription: string
  readonly trustedFriendTitle: string
  readonly trustedFriendDescription: string
  readonly caution: string
}

const ExplanationFrame = styled(YStack, {
  name: 'TrustedFriendExplanation',
  gap: '$5',
  width: '100%',
})

const ComparisonRow = styled(XStack, {
  name: 'TrustedFriendExplanationComparison',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  gap: '$4',
  alignItems: 'flex-start',
})

function Node({label, avatar}: ExplanationNode): React.JSX.Element {
  return (
    <YStack width="$12.5" gap="$2" alignItems="center">
      <Stack width="$9.5" height="$9.5">
        {avatar}
      </Stack>
      <Typography
        variant="micro"
        color="$foregroundPrimary"
        fontWeight="600"
        textAlign="center"
      >
        {label}
      </Typography>
    </YStack>
  )
}

function TwoWayArrow(): React.JSX.Element {
  const theme = useTheme()
  const color = theme.accentHighlightSecondary.get()
  const {size: sizes, space} = getTokens()
  const headHeight = sizes['$3.5'].val
  const headWidth = headHeight / 2
  const headPoints = (tipX: number, baseX: number): string =>
    `${tipX},${headWidth} ${baseX},0 ${baseX},${headHeight}`

  return (
    <Stack
      flex={1}
      height="$9.5"
      marginHorizontal={space.$2.val + space.$1.val}
      justifyContent="center"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    >
      <XStack alignItems="center">
        <Svg width={headWidth} height={headHeight}>
          <Polygon points={headPoints(0, headWidth)} fill={color} />
        </Svg>
        <Stack
          flex={1}
          height="$1"
          backgroundColor="$accentHighlightSecondary"
        />
        <Svg width={headWidth} height={headHeight}>
          <Polygon points={headPoints(headWidth, 0)} fill={color} />
        </Svg>
      </XStack>
    </Stack>
  )
}

export function TrustedFriendExplanation({
  you,
  trustedFriend,
  otherSide,
  caption,
  commonFriendTitle,
  commonFriendDescription,
  trustedFriendTitle,
  trustedFriendDescription,
  caution,
}: TrustedFriendExplanationProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <ExplanationFrame>
      <YStack gap="$2">
        <XStack alignItems="flex-start">
          <Node {...you} />
          <TwoWayArrow />
          <Node
            label={trustedFriend.label}
            avatar={
              <Avatar
                {...trustedFriend.avatar}
                customSize="$9.5"
                trusted
                trustBadgeRingColor="$backgroundSecondary"
              />
            }
          />
          <TwoWayArrow />
          <Node {...otherSide} />
        </XStack>
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {caption}
        </Typography>
      </YStack>
      <YStack gap="$1">
        <ComparisonRow
          borderTopLeftRadius="$4"
          borderTopRightRadius="$4"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
        >
          <PeopleUsers
            size={getTokens().size.$6.val}
            color={theme.foregroundSecondary.get()}
          />
          <YStack gap="$1" flex={1}>
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {commonFriendTitle}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {commonFriendDescription}
            </Typography>
          </YStack>
        </ComparisonRow>
        <ComparisonRow
          borderTopLeftRadius="$2"
          borderTopRightRadius="$2"
          borderBottomLeftRadius="$4"
          borderBottomRightRadius="$4"
        >
          <TrustBadge size="xlarge" />
          <YStack gap="$1" flex={1}>
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {trustedFriendTitle}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {trustedFriendDescription}
            </Typography>
          </YStack>
        </ComparisonRow>
      </YStack>
      <Typography variant="micro" color="$foregroundSecondary">
        {caution}
      </Typography>
    </ExplanationFrame>
  )
}
