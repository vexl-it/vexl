import type {TypographyVariant} from '@vexl-next/ui'
import {SizableText, Theme, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const typographyVariants: ReadonlyArray<{
  readonly label: string
  readonly variant: TypographyVariant
}> = [
  {label: 'Heading1', variant: 'heading1'},
  {label: 'PressBody', variant: 'presBody'},
  {label: 'Heading2', variant: 'heading2'},
  {label: 'GraphPrice', variant: 'graphPrice'},
  {label: 'Heading3', variant: 'heading3'},
  {label: 'Titles', variant: 'titles'},
  {label: 'TitlesSmall', variant: 'titlesSmall'},
  {label: 'Paragraph', variant: 'paragraph'},
  {label: 'ParagraphDemibold', variant: 'paragraphDemibold'},
  {label: 'TabLarge', variant: 'tabLarge'},
  {label: 'TabLargeBold', variant: 'tabLargeBold'},
  {label: 'ParagraphSmallBold', variant: 'paragraphSmallBold'},
  {label: 'ParagraphSmall', variant: 'paragraphSmall'},
  {label: 'DescriptionBold', variant: 'descriptionBold'},
  {label: 'Description', variant: 'description'},
  {label: 'TabSmallBold', variant: 'tabSmallBold'},
  {label: 'TabSmall', variant: 'tabSmall'},
  {label: 'Micro', variant: 'micro'},
]

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$5"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <YStack gap="$5">
          {typographyVariants.map((entry) => (
            <Typography
              key={entry.variant}
              variant={entry.variant}
              color="$foregroundPrimary"
            >
              {entry.label}
            </Typography>
          ))}
        </YStack>
      </YStack>
    </Theme>
  )
}

export function TypographyScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <ThemedColumn theme="light" />
        <ThemedColumn theme="dark" />
      </YStack>
    </ScrollView>
  )
}
