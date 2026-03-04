import React from 'react'
import {styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Circle, SizableText, XStack, YStack} from '../primitives'

export interface OfferCardProps {
  readonly avatar?: React.ReactNode
  readonly name: string
  readonly premiumLabel?: string
  readonly textTag: React.ReactNode
  readonly iconTag: React.ReactNode
  readonly commonFriends?: string
  readonly clubName?: string
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

const NameText = styled(SizableText, {
  name: 'OfferCardName',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
  numberOfLines: 1,
})

const PremiumText = styled(SizableText, {
  name: 'OfferCardPremium',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$accentHighlightSecondary',
  numberOfLines: 1,
})

const SubtitleText = styled(SizableText, {
  name: 'OfferCardSubtitle',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
  numberOfLines: 1,
})

const DetailText = styled(SizableText, {
  name: 'OfferCardDetail',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
  numberOfLines: 1,
})

export function OfferCard({
  avatar,
  name,
  premiumLabel,
  textTag,
  iconTag,
  commonFriends,
  clubName,
  price,
  description,
  details,
  onPress,
}: OfferCardProps): React.JSX.Element {
  const theme = useTheme()
  const secondaryColor = theme.foregroundSecondary.val

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
                  <NameText>{name}</NameText>
                  {premiumLabel != null ? (
                    <PremiumText>{premiumLabel}</PremiumText>
                  ) : null}
                </XStack>
                <XStack gap="$1" alignItems="center">
                  {textTag}
                  {iconTag}
                </XStack>
              </XStack>
              {commonFriends != null ? (
                clubName != null ? (
                  <XStack gap="$2" alignItems="center">
                    <SubtitleText>{clubName}</SubtitleText>
                    <Circle size="$2" backgroundColor={secondaryColor} />
                    <XStack gap="$1" alignItems="center">
                      <PeopleUsers size={16} color={secondaryColor} />
                      <SubtitleText>{commonFriends}</SubtitleText>
                    </XStack>
                  </XStack>
                ) : (
                  <XStack gap="$1" alignItems="center">
                    <PeopleUsers size={16} color={secondaryColor} />
                    <SubtitleText>{commonFriends}</SubtitleText>
                  </XStack>
                )
              ) : null}
            </YStack>
          </XStack>
        ) : (
          <XStack alignItems="center" justifyContent="space-between">
            <NameText>{name}</NameText>
            <XStack gap="$1" alignItems="center">
              {textTag}
              {iconTag}
            </XStack>
          </XStack>
        )}
      </HeaderFrame>
      <ContentFrame>
        <SizableText
          fontFamily="$heading"
          fontWeight="400"
          fontSize="$1"
          letterSpacing="$1"
          lineHeight="$1"
          color="$foregroundPrimary"
        >
          {price}
        </SizableText>
        <SizableText
          fontFamily="$body"
          fontWeight="500"
          fontSize="$2"
          letterSpacing="$2"
          lineHeight="$2"
          color="$foregroundSecondary"
          numberOfLines={2}
        >
          {description}
        </SizableText>
        <XStack gap="$2" alignItems="center">
          {details.map((detail, index) => (
            <React.Fragment key={detail}>
              {index > 0 ? (
                <Circle size="$2" backgroundColor={secondaryColor} />
              ) : null}
              <DetailText flex={index === details.length - 1 ? 1 : undefined}>
                {detail}
              </DetailText>
            </React.Fragment>
          ))}
        </XStack>
      </ContentFrame>
    </CardFrame>
  )
}
