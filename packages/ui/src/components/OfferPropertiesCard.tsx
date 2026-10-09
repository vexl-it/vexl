import {Array, pipe} from 'effect'
import React from 'react'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface OfferPropertiesCardRow {
  readonly label: string
  /** Multiple values are rendered on separate lines, joined with commas. */
  readonly value: string | readonly string[]
  readonly numberOfLines?: number
}

export interface OfferPropertiesCardProps {
  readonly rows: readonly OfferPropertiesCardRow[]
  /** Renders only the rows, without the card background and padding. */
  readonly minimalContainer?: boolean
}

function OfferPropertiesCardRowView({
  label,
  value,
  numberOfLines,
}: OfferPropertiesCardRow): React.JSX.Element {
  return (
    <XStack alignItems="flex-start" gap="$5">
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        flexShrink={0}
        numberOfLines={1}
      >
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          textAlign="right"
          flex={1}
          numberOfLines={numberOfLines}
        >
          {value}
        </Typography>
      ) : (
        <YStack flex={1} gap="$2">
          {pipe(
            value,
            Array.map((line, i) => (
              <Typography
                key={i}
                variant="descriptionBold"
                color="$foregroundPrimary"
                textAlign="right"
              >
                {i < value.length - 1 ? `${line},` : line}
              </Typography>
            ))
          )}
        </YStack>
      )}
    </XStack>
  )
}

export function OfferPropertiesCard({
  rows,
  minimalContainer,
}: OfferPropertiesCardProps): React.JSX.Element {
  const content = pipe(
    rows,
    Array.map((row) => <OfferPropertiesCardRowView key={row.label} {...row} />)
  )

  return minimalContainer ? (
    <YStack gap="$5">{content}</YStack>
  ) : (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      py="$4"
      px="$6"
      gap="$5"
    >
      {content}
    </YStack>
  )
}
