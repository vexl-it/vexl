import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Circle, XStack} from '../primitives'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

export interface CommonFriendsCountProps {
  readonly clubLabels?: readonly string[]
  readonly commonFriends?: string
  readonly trustedFriends?: string
}

const CommonFriendsCountFrame = styled(XStack, {
  name: 'CommonFriendsCount',
  flexWrap: 'wrap',
  columnGap: '$2',
  rowGap: '$1',
  alignItems: 'center',
  flexShrink: 1,
  minWidth: 0,
})

function Separator(): React.JSX.Element {
  return (
    <Circle size="$2" backgroundColor="$foregroundSecondary" flexShrink={0} />
  )
}

export function CommonFriendsCount({
  clubLabels,
  commonFriends,
  trustedFriends,
}: CommonFriendsCountProps): React.JSX.Element | null {
  const theme = useTheme()
  const hasClubs = clubLabels != null && clubLabels.length > 0

  if (!hasClubs && commonFriends == null) return null

  return (
    <CommonFriendsCountFrame flexWrap={hasClubs ? 'nowrap' : 'wrap'}>
      <XStack flexShrink={1} minWidth={0} gap="$2" alignItems="center">
        {clubLabels?.map((label, index) => (
          <React.Fragment key={`${label}-${index}`}>
            {index > 0 ? <Separator /> : null}
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
              flexShrink={1}
              minWidth={0}
            >
              {label}
            </Typography>
          </React.Fragment>
        ))}
        {commonFriends != null ? (
          <>
            {hasClubs ? <Separator /> : null}
            <XStack gap="$1" alignItems="center" flexShrink={0}>
              <PeopleUsers
                size={getTokens().size.$5.val}
                color={theme.foregroundSecondary.get()}
              />
              <Typography variant="micro" color="$foregroundSecondary">
                {commonFriends}
              </Typography>
            </XStack>
          </>
        ) : null}
      </XStack>
      {commonFriends != null && trustedFriends != null ? (
        <XStack flexShrink={0} gap="$2" alignItems="center">
          <Separator />
          <XStack gap="$1" alignItems="center" flexShrink={0}>
            <TrustBadge />
            <Typography
              variant="micro"
              color="$foregroundPrimary"
              fontWeight="600"
            >
              {trustedFriends}
            </Typography>
          </XStack>
        </XStack>
      ) : null}
    </CommonFriendsCountFrame>
  )
}
