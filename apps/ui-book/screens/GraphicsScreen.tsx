import {
  FaqAnonymizationNotice,
  FaqAnonymousCounterpart,
  FaqDesigned,
  FaqNoRatings,
  FaqNotifications,
  FaqOpenSource,
  FaqStayAnonymous,
  FaqWhatIsVexl,
  SizableText,
  Stack,
  useVexlTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

const graphics = [
  {label: 'FaqWhatIsVexl', Component: FaqWhatIsVexl},
  {label: 'FaqAnonymizationNotice', Component: FaqAnonymizationNotice},
  {label: 'FaqAnonymousCounterpart', Component: FaqAnonymousCounterpart},
  {label: 'FaqOpenSource', Component: FaqOpenSource},
  {label: 'FaqStayAnonymous', Component: FaqStayAnonymous},
  {label: 'FaqDesigned', Component: FaqDesigned},
  {label: 'FaqNotifications', Component: FaqNotifications},
  {label: 'FaqNoRatings', Component: FaqNoRatings},
] as const

export function GraphicsScreen(): React.JSX.Element {
  const {resolvedTheme} = useVexlTheme()
  const [activeGraphic, setActiveGraphic] = useState<string | null>(null)

  const activeEntry = graphics.find((g) => g.label === activeGraphic)

  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          FAQ Graphics
        </SizableText>
        <SizableText
          fontFamily="$body"
          fontWeight="400"
          fontSize={14}
          color="$foregroundSecondary"
        >
          Tap a button to preview the graphic. Current theme: {resolvedTheme}
        </SizableText>

        <XStack flexWrap="wrap" gap="$3">
          {graphics.map((entry) => (
            <Stack
              key={entry.label}
              onPress={() => {
                setActiveGraphic(
                  activeGraphic === entry.label ? null : entry.label
                )
              }}
              backgroundColor={
                activeGraphic === entry.label
                  ? '$backgroundTertiary'
                  : '$backgroundSecondary'
              }
              paddingVertical="$3"
              paddingHorizontal="$4"
              borderRadius="$2.5"
              borderWidth={activeGraphic === entry.label ? 2 : 0}
              borderColor="$foregroundSecondary"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="600"
                fontSize={13}
                color="$foregroundPrimary"
              >
                {entry.label}
              </SizableText>
            </Stack>
          ))}
        </XStack>

        {activeEntry ? (
          <YStack gap="$4" paddingTop="$3">
            <SizableText
              fontFamily="$heading"
              fontWeight="700"
              fontSize={16}
              color="$foregroundPrimary"
            >
              {activeEntry.label}
            </SizableText>

            <XStack gap="$4" flexWrap="wrap">
              <YStack
                gap="$2"
                alignItems="center"
                backgroundColor="#363636"
                padding="$4"
                borderRadius="$4"
              >
                <SizableText
                  fontFamily="$body"
                  fontWeight="500"
                  fontSize={12}
                  color="white"
                >
                  Dark
                </SizableText>
                <activeEntry.Component
                  variant="dark"
                  width={150}
                  height={150}
                />
              </YStack>

              <YStack
                gap="$2"
                alignItems="center"
                backgroundColor="#efedf3"
                padding="$4"
                borderRadius="$4"
              >
                <SizableText
                  fontFamily="$body"
                  fontWeight="500"
                  fontSize={12}
                  color="black"
                >
                  Light
                </SizableText>
                <activeEntry.Component
                  variant="light"
                  width={150}
                  height={150}
                />
              </YStack>
            </XStack>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  )
}
