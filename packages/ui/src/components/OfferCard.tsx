import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Circle, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface OfferCardProps {
  readonly avatar?: React.ReactNode
  readonly name: string
  readonly premiumLabel?: string
  readonly textTag: React.ReactNode
  readonly iconTag: React.ReactNode
  readonly commonFriends?: string
  readonly clubNames?: readonly string[]
  readonly price: string
  readonly description: string
  readonly details: readonly string[]
  readonly onPress?: () => void
}

const CardFrame = styled(YStack, {
  name: 'OfferCard',
  gap: '$0.5',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const HeaderFrame = styled(YStack, {
  name: 'OfferCardHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

const ContentFrame = styled(YStack, {
  name: 'OfferCardContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
  gap: '$3',
})

export function OfferCard({
  avatar,
  name,
  premiumLabel,
  textTag,
  iconTag,
  commonFriends,
  clubNames,
  price,
  description,
  details,
  onPress,
}: OfferCardProps): React.JSX.Element {
  const theme = useTheme()
  const sizeTokens = getTokens().size
  const secondaryColor = theme.foregroundSecondary.get()

  const hasClubs = clubNames != null && clubNames.length > 0
  const hasFriends = commonFriends != null
  const subRow =
    hasClubs || hasFriends ? (
      <XStack gap="$2" alignItems="center" flexShrink={1} minWidth={0}>
        {clubNames?.map((cn, idx) => (
          <React.Fragment key={cn}>
            {idx > 0 ? (
              <Circle size="$2" backgroundColor={secondaryColor} />
            ) : null}
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
            >
              {cn}
            </Typography>
          </React.Fragment>
        ))}
        {hasClubs && hasFriends ? (
          <Circle size="$2" backgroundColor={secondaryColor} />
        ) : null}
        {hasFriends ? (
          <XStack gap="$1" alignItems="center">
            <PeopleUsers size={sizeTokens.$5.val} color={secondaryColor} />
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
            >
              {commonFriends}
            </Typography>
          </XStack>
        ) : null}
      </XStack>
    ) : null

  return (
    <CardFrame pressable={!!onPress} onPress={onPress}>
      <HeaderFrame>
        {avatar != null ? (
          <XStack gap="$3" alignItems="flex-start">
            {avatar}
            <YStack flex={1} minWidth={0}>
              <XStack alignItems="center" justifyContent="space-between">
                <XStack
                  gap="$2"
                  alignItems="center"
                  flexShrink={1}
                  minWidth={0}
                >
                  <Typography
                    variant="descriptionBold"
                    color="$foregroundPrimary"
                    numberOfLines={1}
                  >
                    {name}
                  </Typography>
                  {premiumLabel != null ? (
                    <Typography
                      variant="descriptionBold"
                      color="$accentHighlightSecondary"
                      numberOfLines={1}
                    >
                      {premiumLabel}
                    </Typography>
                  ) : null}
                </XStack>
                <XStack gap="$1" alignItems="center">
                  {textTag}
                  {iconTag}
                </XStack>
              </XStack>
              {subRow}
            </YStack>
          </XStack>
        ) : (
          <XStack gap="$2" alignItems="center" justifyContent="space-between">
            <YStack gap="$1" flexShrink={1} minWidth={0}>
              <Typography
                variant="descriptionBold"
                color="$foregroundPrimary"
                numberOfLines={1}
              >
                {name}
              </Typography>
              {subRow}
            </YStack>
            <XStack gap="$1" alignItems="center">
              {textTag}
              {iconTag}
            </XStack>
          </XStack>
        )}
      </HeaderFrame>
      <ContentFrame>
        <Typography variant="tabSmall" color="$foregroundPrimary">
          {price}
        </Typography>
        <Typography
          variant="description"
          color="$foregroundSecondary"
          numberOfLines={2}
        >
          {description}
        </Typography>
        <XStack gap="$2" alignItems="center">
          {details.map((detail, index) => (
            <React.Fragment key={detail}>
              {index > 0 ? (
                <Circle size="$2" backgroundColor={secondaryColor} />
              ) : null}
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
                flex={index === details.length - 1 ? 1 : undefined}
              >
                {detail}
              </Typography>
            </React.Fragment>
          ))}
        </XStack>
      </ContentFrame>
    </CardFrame>
  )
}
