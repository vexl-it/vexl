import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {
  Avatar,
  avatarsSvg,
  Button,
  Stack,
  TextTag,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {type ChatTransientMessageId} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'

type TextTagVariant = React.ComponentProps<typeof TextTag>['variant']
const BasicAvatar = avatarsSvg[0]

interface Props {
  readonly buttonText?: string
  readonly children?: React.ReactNode
  readonly description?: string
  readonly details?: readonly string[]
  readonly onClosePress?: () => void
  readonly managedHidingId?: ChatMessageId | ChatTransientMessageId | undefined
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
  managedHidingId,
  onPress,
  statusLabel,
  statusVariant = 'waitingForConfirmation',
  title,
}: Props): React.JSX.Element | null {
  const {t} = useTranslation()
  const {createHideMessageAtom} = useMolecule(chatMolecule)
  const [isHidden, setHidden] = useAtom(
    useMemo(() => {
      if (!managedHidingId) return atom(false)
      return createHideMessageAtom(managedHidingId)
    }, [createHideMessageAtom, managedHidingId])
  )
  const theme = useTheme()
  const shouldRenderTextContent =
    title || description || (details && details.length > 0)

  if (isHidden) return null
  return (
    <YStack gap="$1" mt="$4" mx="$4">
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
          <Avatar customSize={24}>
            {BasicAvatar ? <BasicAvatar size={24} /> : null}
          </Avatar>
          <XStack alignItems="center" gap="$0">
            <Typography
              lineHeight="100%"
              color="$foregroundPrimary"
              variant="paragraphSmallBold"
            >
              {t('common.vexl')}
            </Typography>
            <Typography
              lineHeight="100%"
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
          <TouchableOpacity onPress={onClosePress}>
            <Stack>
              <XmarkCancelClose
                color={theme.foregroundSecondary.val}
                size={24}
              />
            </Stack>
          </TouchableOpacity>
        ) : managedHidingId ? (
          <TouchableOpacity
            onPress={() => {
              setHidden(true)
            }}
          >
            <Stack>
              <XmarkCancelClose
                color={theme.foregroundSecondary.val}
                size={24}
              />
            </Stack>
          </TouchableOpacity>
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
