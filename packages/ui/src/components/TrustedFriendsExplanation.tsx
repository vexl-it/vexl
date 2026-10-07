import React from 'react'
import Svg, {Path} from 'react-native-svg'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Stack, XStack, YStack} from '../primitives'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

export interface TrustedFriendsExplanationNode {
  readonly avatar: React.ReactNode
  readonly label: string
}

export interface TrustedFriendsExplanationComparison {
  readonly title: string
  readonly description: string
}

export interface TrustedFriendsExplanationProps {
  readonly you: TrustedFriendsExplanationNode
  readonly trustedFriend: TrustedFriendsExplanationNode
  readonly otherPerson: TrustedFriendsExplanationNode
  readonly caption: string
  readonly commonFriendComparison: TrustedFriendsExplanationComparison
  readonly trustedFriendComparison: TrustedFriendsExplanationComparison
  readonly caution: string
}

const DIAGRAM_NODE_WIDTH = 70

const TrustedFriendsExplanationFrame = styled(YStack, {
  name: 'TrustedFriendsExplanation',
  width: '100%',
  gap: '$5',
})

function DiagramNode({
  node,
  trusted = false,
}: {
  readonly node: TrustedFriendsExplanationNode
  readonly trusted?: boolean
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack
      width={DIAGRAM_NODE_WIDTH}
      gap="$3"
      alignItems="center"
      flexShrink={0}
    >
      <Stack position="relative">
        {node.avatar}
        {trusted ? (
          <TrustBadge
            variant="overlay"
            ringColor={theme.backgroundSecondary.get()}
          />
        ) : null}
      </Stack>
      <Typography
        variant="micro"
        color="$foregroundPrimary"
        fontWeight="600"
        textAlign="center"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {node.label}
      </Typography>
    </YStack>
  )
}

function ContactLink(): React.JSX.Element {
  const theme = useTheme()

  return (
    <Stack flex={1} minWidth="$3" mx="$2" mt="$6" aria-hidden>
      <Svg
        width="100%"
        height={getTokens().size.$3.val}
        viewBox="0 0 40 10"
        preserveAspectRatio="none"
      >
        <Path
          d="M0 5L6 0V4H34V0L40 5L34 10V6H6V10Z"
          fill={theme.accentHighlightSecondary.get()}
        />
      </Svg>
    </Stack>
  )
}

function ComparisonRow({
  comparison,
  trusted = false,
}: {
  readonly comparison: TrustedFriendsExplanationComparison
  readonly trusted?: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const iconSize = getTokens().size.$6.val

  return (
    <XStack
      backgroundColor="$backgroundTertiary"
      padding="$4"
      gap="$4"
      alignItems="flex-start"
      borderTopLeftRadius={trusted ? '$1' : '$4'}
      borderTopRightRadius={trusted ? '$1' : '$4'}
      borderBottomLeftRadius={trusted ? '$4' : '$1'}
      borderBottomRightRadius={trusted ? '$4' : '$1'}
    >
      <Stack flexShrink={0}>
        {trusted ? (
          <TrustBadge size={iconSize} />
        ) : (
          <PeopleUsers
            size={iconSize}
            color={theme.foregroundSecondary.get()}
          />
        )}
      </Stack>
      <YStack flex={1} gap="$2">
        <Typography variant="descriptionBold" color="$foregroundPrimary">
          {comparison.title}
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          {comparison.description}
        </Typography>
      </YStack>
    </XStack>
  )
}

export function TrustedFriendsExplanation({
  you,
  trustedFriend,
  otherPerson,
  caption,
  commonFriendComparison,
  trustedFriendComparison,
  caution,
}: TrustedFriendsExplanationProps): React.JSX.Element {
  return (
    <TrustedFriendsExplanationFrame>
      <YStack gap="$2">
        <XStack
          alignItems="flex-start"
          justifyContent="space-between"
          px="$2"
          py="$3"
        >
          <DiagramNode node={you} />
          <ContactLink />
          <DiagramNode node={trustedFriend} trusted />
          <ContactLink />
          <DiagramNode node={otherPerson} />
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
        <ComparisonRow comparison={commonFriendComparison} />
        <ComparisonRow comparison={trustedFriendComparison} trusted />
      </YStack>
      <Typography variant="micro" color="$foregroundSecondary">
        {caution}
      </Typography>
    </TrustedFriendsExplanationFrame>
  )
}
