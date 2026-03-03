import {BlogCard, Image, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const testBlogSource = require('../assets/testBlog.png') as number

function BlogImage(): React.JSX.Element {
  return (
    <Image
      source={testBlogSource}
      style={{width: '100%', height: 162}}
      resizeMode="cover"
    />
  )
}

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
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

        <BlogCard
          image={<BlogImage />}
          title="Why Vexl doesn't rate offers or users"
          description="How do you create compelling presentations that wow your colleagues and impress your managers?"
          date="July 23, 2025"
        />

        <BlogCard
          image={<BlogImage />}
          title="How to buy Bitcoin without KYC"
          description="A short guide on buying Bitcoin peer-to-peer while keeping your privacy intact."
          date="June 15, 2025"
          onPress={() => {}}
        />
      </YStack>
    </Theme>
  )
}

export function BlogCardScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Blog Card
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
