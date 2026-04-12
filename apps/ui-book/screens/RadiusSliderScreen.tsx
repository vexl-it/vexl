import {
  RadiusSlider,
  SizableText,
  Theme,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function InteractiveSlider({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [radius, setRadius] = useState(5)

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <RadiusSlider
          min={1}
          max={50}
          value={radius}
          onValueChange={setRadius}
        />
        <Typography variant="micro" color="$foregroundSecondary">
          Radius: {radius} km
        </Typography>
      </YStack>
    </Theme>
  )
}

export function RadiusSliderScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Radius Slider
        </SizableText>

        <InteractiveSlider theme="light" />
        <InteractiveSlider theme="dark" />
      </YStack>
    </ScrollView>
  )
}
