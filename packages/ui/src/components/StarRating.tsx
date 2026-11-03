import {Array, pipe} from 'effect'
import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {StarFilled} from '../icons/StarFilled'
import {StarOutline} from '../icons/StarOutline'
import {Stack, XStack} from '../primitives'

const STARS = [1, 2, 3, 4, 5] as const

export interface StarRatingProps {
  readonly value: number
  readonly onChange: (value: number) => void
}

export function StarRating({
  value,
  onChange,
}: StarRatingProps): React.JSX.Element {
  const theme = useTheme()
  const starSize = getTokens().size.$8.val

  return (
    <XStack alignItems="center" gap="$2">
      {pipe(
        STARS,
        Array.map((star) => (
          <Stack
            key={star}
            role="button"
            aria-label={String(star)}
            alignItems="center"
            justifyContent="center"
            width="$8"
            height="$8"
            onPress={() => {
              onChange(star)
            }}
          >
            {star <= value ? (
              <StarFilled
                size={starSize}
                color={theme.accentYellowPrimary.get()}
              />
            ) : (
              <StarOutline
                size={starSize}
                color={theme.foregroundSecondary.get()}
              />
            )}
          </Stack>
        ))
      )}
    </XStack>
  )
}
