import {Array, pipe} from 'effect'
import React from 'react'

import {AvatarBasic1} from '../assets/anonymousAvatars/AvatarBasic1'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {XStack, YStack} from '../primitives'
import {Avatar, resolveSizePx} from './Avatar'
import {Button} from './Button'
import {NavButton} from './NavButton'
import {TextTag, type TextTagVariant} from './TextTag'
import {TwoToneCard, type TwoToneCardProps} from './TwoToneCard'
import {Typography} from './Typography'

export interface BotMessageCardProps extends Omit<
  TwoToneCardProps,
  'children' | 'onPress'
> {
  /** Sender name, e.g. "Vexl". */
  readonly senderLabel: string
  /** Accent-coloured suffix right after the sender name, e.g. "bot". */
  readonly senderAccentLabel?: string
  readonly title?: string
  readonly description?: string
  readonly details?: readonly string[]
  /** Dims description and details, e.g. for outdated messages. */
  readonly muted?: boolean
  /** Shown in the header; takes precedence over the close button. */
  readonly statusLabel?: string
  readonly statusVariant?: TextTagVariant
  readonly onClose?: () => void
  readonly buttonLabel?: string
  readonly onButtonPress?: () => void
  readonly children?: React.ReactNode
}

export function BotMessageCard({
  senderLabel,
  senderAccentLabel,
  title,
  description,
  details = [],
  muted = false,
  statusLabel,
  statusVariant = 'waitingForConfirmation',
  onClose,
  buttonLabel,
  onButtonPress,
  children,
  ...rest
}: BotMessageCardProps): React.JSX.Element {
  const textColor = muted ? '$foregroundTertiary' : '$foregroundSecondary'
  const hasTextContent =
    !!title || !!description || Array.isNonEmptyReadonlyArray(details)

  return (
    <TwoToneCard {...rest}>
      <TwoToneCard.Header
        flexDirection="row"
        alignItems="center"
        gap="$3"
        justifyContent="space-between"
      >
        <XStack alignItems="center" flex={1} gap="$2">
          <Avatar size="$7">
            <AvatarBasic1 size={resolveSizePx('$7')} />
          </Avatar>
          <XStack alignItems="center">
            <Typography
              lineHeight="100%"
              color="$foregroundPrimary"
              variant="paragraphSmallBold"
            >
              {senderLabel}
            </Typography>
            {senderAccentLabel ? (
              <Typography
                lineHeight="100%"
                color="$accentHighlightSecondary"
                variant="paragraphSmallBold"
              >
                {senderAccentLabel}
              </Typography>
            ) : null}
          </XStack>
        </XStack>
        {statusLabel ? (
          <TextTag
            alignSelf="flex-start"
            label={statusLabel}
            variant={statusVariant}
          />
        ) : onClose ? (
          <NavButton
            variant="transparent"
            icon={XmarkCancelClose}
            width="$7"
            height="$7"
            onPress={onClose}
          />
        ) : null}
      </TwoToneCard.Header>

      <TwoToneCard.Content gap="$3" padding="$5">
        {hasTextContent ? (
          <YStack gap="$3">
            {title ? (
              <Typography color="$foregroundPrimary" variant="descriptionBold">
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography color={textColor} variant="description">
                {description}
              </Typography>
            ) : null}
            {Array.isNonEmptyReadonlyArray(details) ? (
              <YStack gap="$1">
                {pipe(
                  details,
                  Array.map((detail, index) => (
                    <Typography
                      key={`${detail}-${String(index)}`}
                      color={textColor}
                      variant="description"
                    >
                      {detail}
                    </Typography>
                  ))
                )}
              </YStack>
            ) : null}
          </YStack>
        ) : null}

        {buttonLabel && onButtonPress ? (
          <Button
            onPress={onButtonPress}
            size="medium"
            variant="primary"
            width="100%"
          >
            {buttonLabel}
          </Button>
        ) : null}

        {children}
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}
