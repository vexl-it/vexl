import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ConferenceClub} from '../icons'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface ClubReachCardProps {
  readonly title: string
  readonly reachLabel: string
}

const ClubReachCardFrame = styled(XStack, {
  name: 'ClubReachCard',
  alignItems: 'center',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$5',
  gap: '$4',
  padding: '$4',
})

const ReachPill = styled(XStack, {
  name: 'ClubReachCardPill',
  alignItems: 'center',
  alignSelf: 'flex-start',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$11',
  gap: '$2',
  maxWidth: '100%',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
})

export function ClubReachCard({
  title,
  reachLabel,
}: ClubReachCardProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = theme.foregroundSecondary.get()

  return (
    <ClubReachCardFrame>
      <YStack flex={1} gap="$2">
        <Typography variant="tabSmallBold" color="$foregroundPrimary">
          {title}
        </Typography>
        <ReachPill>
          <ConferenceClub size={16} color={iconColor} />
          <Typography
            variant="description"
            color="$foregroundPrimary"
            flexShrink={1}
          >
            {reachLabel}
          </Typography>
        </ReachPill>
      </YStack>
    </ClubReachCardFrame>
  )
}
