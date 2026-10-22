import {BackupPin} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {
  Button,
  ChevronLeft,
  CodeInput,
  NavigationBar,
  Screen,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Option, Schema} from 'effect'
import React from 'react'
import InlineErrorText from '../InlineErrorText'

interface Props {
  readonly title: string
  readonly text: string
  readonly pin: string
  readonly onPinChange: (pin: string) => void
  readonly errorMessage?: string
  readonly buttonLabel: string
  readonly busy?: boolean
  readonly onSubmit: (pin: BackupPin) => void
  readonly onBack: () => void
  readonly secondaryAction?: {
    readonly label: string
    readonly onPress: () => void
  }
}

export default function BackupPinScreen({
  title,
  text,
  pin,
  onPinChange,
  errorMessage,
  buttonLabel,
  busy,
  onSubmit,
  onBack,
  secondaryAction,
}: Props): React.ReactElement {
  const validPin = Schema.decodeOption(BackupPin)(pin)

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          leftAction={{icon: ChevronLeft, onPress: onBack}}
        />
      }
      footer={
        <YStack gap="$4">
          <Button
            disabled={Option.isNone(validPin) || busy}
            onPress={() => {
              if (Option.isSome(validPin)) onSubmit(validPin.value)
            }}
          >
            {buttonLabel}
          </Button>
          {secondaryAction ? (
            <Button
              disabled={busy}
              variant="secondary"
              onPress={secondaryAction.onPress}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </YStack>
      }
    >
      <YStack gap="$7" paddingVertical="$5">
        <YStack gap="$3">
          <Typography color="$foregroundPrimary" variant="heading3">
            {title}
          </Typography>
          <Typography color="$foregroundSecondary" variant="paragraphSmall">
            {text}
          </Typography>
        </YStack>
        <CodeInput
          editable={!busy}
          maxLength={8}
          minLength={4}
          onChangeText={onPinChange}
          secure
          value={pin}
        />
        <InlineErrorText>{errorMessage}</InlineErrorText>
      </YStack>
    </Screen>
  )
}
