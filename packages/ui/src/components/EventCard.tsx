import React, {useId} from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg'
import {getTokens, useTheme} from 'tamagui'

import {Circle, Stack, XStack} from '../primitives'
import {Chip} from './Chip'
import {TwoToneCard} from './TwoToneCard'
import {Typography} from './Typography'

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

export function EventCard({
  title,
  details,
  attendees,
  state = 'upcoming',
  onPress,
}: EventCardProps): React.JSX.Element {
  const theme = useTheme()
  const fadeGradientId = useId()

  const bgColor = theme.backgroundSecondary.get()
  const gradientWidth = getTokens().size.$12.val

  const isUpcoming = state === 'upcoming'
  const titleColor = isUpcoming ? '$foregroundPrimary' : '$foregroundSecondary'
  const detailColor = isUpcoming
    ? '$foregroundSecondary'
    : '$foregroundTertiary'

  return (
    <TwoToneCard onPress={onPress}>
      <TwoToneCard.Header>
        <Typography variant="tabSmallBold" color={titleColor}>
          {title}
        </Typography>
      </TwoToneCard.Header>
      <TwoToneCard.Content gap="$3">
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          {details.map((detail, index) => (
            <React.Fragment key={detail}>
              {index > 0 ? (
                <Circle size="$2" backgroundColor={detailColor} />
              ) : null}
              <Typography
                variant="micro"
                color={detailColor}
                flexShrink={index === details.length - 1 ? 1 : 0}
              >
                {detail}
              </Typography>
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
                    id={fadeGradientId}
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
                  fill={`url(#${fadeGradientId})`}
                />
              </Svg>
            </Stack>
          </Stack>
        ) : null}
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}
