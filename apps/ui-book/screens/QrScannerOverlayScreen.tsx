import {
  Button,
  CameraPermissionPrompt,
  QrScannerOverlay,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

type Example = 'camera' | 'permission' | 'manyActions'

const examples: ReadonlyArray<{
  readonly key: Example
  readonly label: string
}> = [
  {key: 'camera', label: 'Camera granted, single action'},
  {key: 'permission', label: 'Camera permission missing'},
  {key: 'manyActions', label: 'Three footer actions (smaller window)'},
]

function FakeCameraPreview(): React.JSX.Element {
  return <Stack flex={1} backgroundColor="$greenDark" />
}

function ActiveExample({
  example,
  onClose,
}: {
  readonly example: Example
  readonly onClose: () => void
}): React.JSX.Element {
  return (
    <QrScannerOverlay
      title="Scan QR code"
      closeLabel="Close"
      onClose={onClose}
      footer={
        example === 'manyActions' ? (
          <>
            <Button variant="primary" onPress={onClose}>
              Enter access code
            </Button>
            <Button variant="secondary" onPress={onClose}>
              Ask for access
            </Button>
            <Button variant="secondary" onPress={onClose}>
              Upload from device
            </Button>
          </>
        ) : (
          <Button variant="primary" onPress={onClose}>
            Close
          </Button>
        )
      }
    >
      {example === 'permission' ? (
        <CameraPermissionPrompt
          message="Vexl needs camera access to scan QR codes."
          buttonLabel="Grant permissions"
          onPress={() => {}}
        />
      ) : (
        <FakeCameraPreview />
      )}
    </QrScannerOverlay>
  )
}

export function QrScannerOverlayScreen(): React.JSX.Element {
  const [active, setActive] = useState<Example | null>(null)

  if (active)
    return (
      <ActiveExample
        example={active}
        onClose={() => {
          setActive(null)
        }}
      />
    )

  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$5" backgroundColor="$backgroundPrimary">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          QR Scanner Overlay
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          Camera UI is theme-independent (always dark). Opens full screen.
        </Typography>
        {examples.map((example) => (
          <Stack
            key={example.key}
            onPress={() => {
              setActive(example.key)
            }}
            backgroundColor="$backgroundSecondary"
            padding="$5"
            borderRadius="$4"
            pressStyle={{opacity: 0.7}}
          >
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {example.label}
            </Typography>
          </Stack>
        ))}
      </YStack>
    </ScrollView>
  )
}
