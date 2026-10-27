import {Array, pipe} from 'effect'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme, type YStackProps} from 'tamagui'

import {avatarsSvg} from '../assets/anonymousAvatars'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {Stack, XStack, YStack} from '../primitives'
import {Avatar} from './Avatar'
import {Button} from './Button'
import {TextTag, type TextTagVariant} from './TextTag'
import {Typography} from './Typography'

const BotAvatar = avatarsSvg[0]
const botAvatarSize = 24

export interface VexlbotActionCardProps extends Omit<YStackProps, 'children'> {
  /** Brand part of the bot name, rendered in the primary color (e.g. "Vexl"). */
  readonly brandLabel: string
  /** Bot part of the bot name, rendered in the highlight color (e.g. "bot"). */
  readonly botLabel: string
  readonly title?: string
  readonly description?: string
  readonly details?: readonly string[]
  /** Shown as a TextTag in the header. Takes precedence over the close button. */
  readonly statusLabel?: string
  readonly statusVariant?: TextTagVariant
  /** Renders a close button in the header when no `statusLabel` is set. */
  readonly onClosePress?: () => void
  /** Renders a full-width primary button when set together with `onPress`. */
  readonly buttonText?: string
  readonly onPress?: () => void
  readonly children?: React.ReactNode
}

function VexlbotActionCardHeader({
  brandLabel,
  botLabel,
  statusLabel,
  statusVariant,
  onClosePress,
}: Pick<
  VexlbotActionCardProps,
  'brandLabel' | 'botLabel' | 'statusLabel' | 'onClosePress'
> & {readonly statusVariant: TextTagVariant}): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundTertiary"
      borderRadius="$6"
      borderBottomLeftRadius="$2"
      borderBottomRightRadius="$2"
      gap="$3"
      justifyContent="space-between"
      padding="$4"
    >
      <XStack alignItems="center" flex={1} gap="$2">
        <Avatar customSize={botAvatarSize}>
          {BotAvatar ? <BotAvatar size={botAvatarSize} /> : null}
        </Avatar>
        <XStack alignItems="center" gap="$0">
          <Typography
            lineHeight="100%"
            color="$foregroundPrimary"
            variant="paragraphSmallBold"
          >
            {brandLabel}
          </Typography>
          <Typography
            lineHeight="100%"
            color="$accentHighlightSecondary"
            variant="paragraphSmallBold"
          >
            {botLabel}
          </Typography>
        </XStack>
      </XStack>
      {statusLabel ? (
        <TextTag
          alignSelf="flex-start"
          label={statusLabel}
          variant={statusVariant}
        />
      ) : onClosePress ? (
        <TouchableOpacity onPress={onClosePress}>
          <Stack>
            <XmarkCancelClose
              color={theme.foregroundSecondary.get()}
              size={24}
            />
          </Stack>
        </TouchableOpacity>
      ) : null}
    </XStack>
  )
}

export function VexlbotActionCard({
  brandLabel,
  botLabel,
  title,
  description,
  details = [],
  statusLabel,
  statusVariant = 'waitingForConfirmation',
  onClosePress,
  buttonText,
  onPress,
  children,
  ...rest
}: VexlbotActionCardProps): React.JSX.Element {
  const hasDetails = Array.isNonEmptyReadonlyArray(details)
  const shouldRenderTextContent = !!title || !!description || hasDetails

  return (
    <YStack gap="$1" {...rest}>
      <VexlbotActionCardHeader
        brandLabel={brandLabel}
        botLabel={botLabel}
        statusLabel={statusLabel}
        statusVariant={statusVariant}
        onClosePress={onClosePress}
      />

      <YStack
        backgroundColor="$backgroundSecondary"
        borderRadius="$6"
        borderTopLeftRadius="$2"
        borderTopRightRadius="$2"
        gap="$3"
        padding="$5"
      >
        {shouldRenderTextContent ? (
          <YStack gap="$3">
            {title ? (
              <Typography color="$foregroundPrimary" variant="descriptionBold">
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography color="$foregroundSecondary" variant="description">
                {description}
              </Typography>
            ) : null}
            {hasDetails ? (
              <YStack gap="$1">
                {pipe(
                  details,
                  Array.map((detail, index) => (
                    <Typography
                      key={`${detail}-${String(index)}`}
                      color="$foregroundSecondary"
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

        {buttonText && onPress ? (
          <Button
            onPress={onPress}
            size="medium"
            variant="primary"
            width="100%"
          >
            {buttonText}
          </Button>
        ) : null}

        {children}
      </YStack>
    </YStack>
  )
}
