import {
  Banner,
  Image,
  ReachNetworkGraphic,
  SizableText,
  StatBanner,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const testBannerSource = require('../assets/testBanner.png') as number

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function BannerImage(): React.JSX.Element {
  return (
    <Image
      source={testBannerSource}
      style={{width: '100%', height: 98, borderRadius: 10}}
      objectFit="cover"
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

        <SectionLabel>Green with image</SectionLabel>
        <Banner
          color="green"
          title="Title"
          description="Description text goes here with more details about the banner."
          image={<BannerImage />}
          primaryButton={{label: 'Label 1'}}
          secondaryButton={{label: 'Label 2'}}
        />

        <SectionLabel>Pink with image</SectionLabel>
        <Banner
          color="pink"
          title="Title"
          description="Description text goes here with more details about the banner."
          image={<BannerImage />}
          primaryButton={{label: 'Label 1'}}
          secondaryButton={{label: 'Label 2'}}
        />

        <SectionLabel>Green without image</SectionLabel>
        <Banner
          color="green"
          title="Give love"
          description="Like Vexl? Help us improve it. Donate some sound money."
          primaryButton={{label: 'Donate'}}
        />

        <SectionLabel>Pink without image</SectionLabel>
        <Banner
          color="pink"
          title="Give love"
          description="Like Vexl? Help us improve it. Donate some sound money."
          primaryButton={{label: 'Donate'}}
        />

        <SectionLabel>Neutral with leading graphic</SectionLabel>
        <Banner
          color="neutral"
          leading={<ReachNetworkGraphic />}
          title="Reach beyond your contacts"
          description="Add a contact so you can also reach the people they know."
        />

        <SectionLabel>Stat green</SectionLabel>
        <StatBanner
          color="green"
          label="Active in Czechia"
          value="1,240 offers"
          description="Your network brings you 31 of them. Add more contacts to grow it and see more offers."
        />

        <SectionLabel>Stat yellow, pressable</SectionLabel>
        <StatBanner
          color="yellow"
          label="Your reach"
          value="125 people"
          description="can see your offers. Add more contacts for a better chance of a trade."
          onPress={() => {}}
        />
      </YStack>
    </Theme>
  )
}

export function BannerScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Banner
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
