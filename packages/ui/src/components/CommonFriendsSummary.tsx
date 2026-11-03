import {Array, pipe} from 'effect'
import React from 'react'

import {PeopleUsers} from '../icons/PeopleUsers'
import {XStack} from '../primitives'
import {DotSeparatedRow} from './DotSeparatedRow'
import {IconLabel} from './IconLabel'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

export interface CommonFriendsSummaryProps {
  readonly clubNames?: readonly string[]
  readonly commonFriends?: string
  readonly trustedFriends?: string
}

export function CommonFriendsSummary({
  clubNames = [],
  commonFriends,
  trustedFriends,
}: CommonFriendsSummaryProps): React.JSX.Element | null {
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
      <IconLabel
        key="common"
        icon={PeopleUsers}
        label={commonFriends}
        flexShrink={countsShrink}
      />
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
    <DotSeparatedRow flexShrink={1} minWidth={0}>
      {parts}
    </DotSeparatedRow>
  )
}
