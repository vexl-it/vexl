import {Array, pipe} from 'effect'
import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Circle, XStack} from '../primitives'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

export interface CommonFriendsSummaryProps {
  readonly clubNames?: readonly string[]
  readonly commonFriends?: string
  readonly trustedFriends?: string
}

const SummaryFrame = styled(XStack, {
  name: 'CommonFriendsSummary',
  gap: '$2',
  alignItems: 'center',
  flexShrink: 1,
  minWidth: 0,
})

export function CommonFriendsSummary({
  clubNames = [],
  commonFriends,
  trustedFriends,
}: CommonFriendsSummaryProps): React.JSX.Element | null {
  const theme = useTheme()
  const clubs = pipe(
    clubNames,
    Array.filter((name) => name.length > 0)
  )
  // Club names truncate first; without them the counts truncate instead.
  const countsShrink = Array.isNonEmptyArray(clubs) ? 0 : 1
  const parts: React.ReactNode[] = pipe(
    clubs,
    Array.map((name, index) => (
      <Typography
        key={`club-${index}`}
        variant="micro"
        color="$foregroundSecondary"
        numberOfLines={1}
        flexShrink={1}
        minWidth={0}
      >
        {name}
      </Typography>
    ))
  )

  if (commonFriends)
    parts.push(
      <XStack
        key="common"
        gap="$1"
        alignItems="center"
        flexShrink={countsShrink}
        minWidth={0}
      >
        <PeopleUsers
          size={getTokens().size.$5.val}
          color={theme.foregroundSecondary.get()}
        />
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
          ellipsizeMode="tail"
          flexShrink={1}
        >
          {commonFriends}
        </Typography>
      </XStack>
    )
  if (trustedFriends)
    parts.push(
      <XStack
        key="trusted"
        gap="$2"
        alignItems="center"
        flexShrink={countsShrink}
        minWidth={0}
      >
        <TrustBadge size="medium" />
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
          ellipsizeMode="tail"
          flexShrink={1}
        >
          {trustedFriends}
        </Typography>
      </XStack>
    )

  if (!Array.isNonEmptyArray(parts)) return null

  return (
    <SummaryFrame>
      {pipe(
        parts,
        Array.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 ? (
              <Circle
                size="$2"
                backgroundColor="$foregroundSecondary"
                flexShrink={0}
              />
            ) : null}
            {part}
          </React.Fragment>
        ))
      )}
    </SummaryFrame>
  )
}
