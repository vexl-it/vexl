import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg'
import {getTokens, styled, useTheme} from 'tamagui'

import {Circle, SizableText, Stack, XStack, YStack} from '../primitives'
import {Chip} from './Chip'

export type EventCardState = 'upcoming' | 'past'

export interface EventCardAttendee {
  readonly id: string
  readonly name: string
  readonly avatarSource?: RNImageProps['source']
}

export interface EventCardProps {
  readonly title: string
  readonly details: readonly string[]
  readonly attendees?: readonly EventCardAttendee[]
  readonly state?: EventCardState
  readonly onPress?: () => void
}

const CardFrame = styled(YStack, {
  name: 'EventCard',
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
  name: 'EventCardHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

const ContentFrame = styled(YStack, {
  name: 'EventCardContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
  gap: '$3',
})

export function EventCard({
  title,
  details,
  attendees,
  state = 'upcoming',
  onPress,
}: EventCardProps): React.JSX.Element {
  const theme = useTheme()
  const isPressable = !!onPress

  const bgColor = theme.backgroundSecondary.val
  const gradientWidth = getTokens().size.$12.val

  const titleColor =
    state === 'upcoming'
      ? theme.foregroundPrimary.val
      : theme.foregroundSecondary.val
  const detailColor =
    state === 'upcoming'
      ? theme.foregroundSecondary.val
      : theme.foregroundTertiary.val

  return (
    <CardFrame pressable={isPressable} onPress={onPress}>
      <HeaderFrame>
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$1"
          letterSpacing="$1"
          lineHeight="$1"
          color={titleColor}
        >
          {title}
        </SizableText>
      </HeaderFrame>
      <ContentFrame>
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          {details.map((detail, index) => (
            <React.Fragment key={detail}>
              {index > 0 ? (
                <Circle size="$2" backgroundColor={detailColor} />
              ) : null}
              <SizableText
                fontFamily="$body"
                fontWeight="500"
                fontSize="$1"
                letterSpacing="$1"
                lineHeight="$1"
                color={detailColor}
                flexShrink={index === details.length - 1 ? 1 : 0}
              >
                {detail}
              </SizableText>
            </React.Fragment>
          ))}
        </XStack>
        {attendees && attendees.length > 0 ? (
          <Stack>
            <XStack gap="$3" overflow="hidden">
              {attendees.map((attendee) => (
                <Chip
                  key={attendee.id}
                  name={attendee.name}
                  avatarSource={attendee.avatarSource}
                />
              ))}
            </XStack>
            <Stack
              position="absolute"
              top={0}
              bottom={0}
              right={0}
              width={gradientWidth}
              pointerEvents="none"
            >
              <Svg width="100%" height="100%">
                <Defs>
                  <SvgLinearGradient
                    id="eventCardAttendeesFade"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <Stop offset="0" stopColor={bgColor} stopOpacity="0" />
                    <Stop offset="0.4" stopColor={bgColor} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  width="100%"
                  height="100%"
                  fill="url(#eventCardAttendeesFade)"
                />
              </Svg>
            </Stack>
          </Stack>
        ) : null}
      </ContentFrame>
    </CardFrame>
  )
}
