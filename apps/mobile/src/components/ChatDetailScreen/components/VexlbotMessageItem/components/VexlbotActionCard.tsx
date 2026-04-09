import {
  Avatar,
  avatarsSvg,
  Button,
  IconButton,
  TextTag,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

type TextTagVariant = React.ComponentProps<typeof TextTag>['variant']
const BasicAvatar = avatarsSvg[0]

interface Props {
  readonly buttonText?: string
  readonly children?: React.ReactNode
  readonly description?: string
  readonly details?: readonly string[]
  readonly onClosePress?: () => void
  readonly onPress?: () => void
  readonly statusLabel?: string
  readonly statusVariant?: TextTagVariant
  readonly title?: string
}

export default function VexlbotActionCard({
  buttonText,
  children,
  description,
  details,
  onClosePress,
  onPress,
  statusLabel,
  statusVariant = 'waitingForConfirmation',
  title,
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const shouldRenderTextContent =
    title || description || (details && details.length > 0)

  return (
    <YStack m="$4" maxWidth="84%" gap="$1" width="100%">
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
        <XStack alignItems="center" flex={1} gap="$1">
          <Avatar customSize={24}>
            {BasicAvatar ? <BasicAvatar size={24} /> : null}
          </Avatar>
          <XStack alignItems="baseline" gap="$0.5">
            <Typography color="$foregroundPrimary" variant="paragraphSmallBold">
              {t('common.vexl')}
            </Typography>
            <Typography
              color="$accentHighlightSecondary"
              variant="paragraphSmallBold"
            >
              {t('vexlbot.bot')}
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
          <IconButton onPress={onClosePress}>
            <XmarkCancelClose color={theme.foregroundSecondary.val} size={24} />
          </IconButton>
        ) : null}
      </XStack>

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
            {details && details.length > 0 ? (
              <YStack gap="$1">
                {details.map((detail, index) => (
                  <Typography
                    key={`${detail}-${String(index)}`}
                    color="$foregroundSecondary"
                    variant="description"
                  >
                    {detail}
                  </Typography>
                ))}
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
