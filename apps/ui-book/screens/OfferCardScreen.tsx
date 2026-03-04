import {
  Avatar,
  avatarsSvg,
  IconTag,
  OfferCard,
  SizableText,
  TextTag,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const testAvatarSource = require('../assets/testAvatar.png') as number

const clubAvatarSource = require('../assets/clubTestAvatar.png') as number

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AnonymousAvatar = avatarsSvg[0]!

function AnonAvatar(): React.JSX.Element {
  return (
    <Avatar size="small" customSize={36}>
      <AnonymousAvatar size={36} />
    </Avatar>
  )
}

function ClubAvatar(): React.JSX.Element {
  return <Avatar size="small" customSize={36} source={clubAvatarSource} />
}

function PremiumAvatar(): React.JSX.Element {
  return <Avatar size="small" customSize={36} source={testAvatarSource} />
}

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

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <SectionLabel>Basic request</SectionLabel>
      <OfferCard
        avatar={<AnonAvatar />}
        name="Direct friend"
        textTag={<TextTag variant="request" label="Request" />}
        iconTag={<IconTag variant="bitcoin" />}
        commonFriends="10 common friends"
        price="10 - 100 Kc"
        description="Looking to buy 0.02 BTC, instant transfer."
        details={[
          'In cash',
          'Vinohrady 1123',
          '\u{1F1EC}\u{1F1E7} \u{1F1E8}\u{1F1FF}',
        ]}
      />

      <SectionLabel>Basic offer (long description)</SectionLabel>
      <OfferCard
        avatar={<AnonAvatar />}
        name="Direct friend"
        textTag={<TextTag variant="offer" label="Offer" />}
        iconTag={<IconTag variant="product" />}
        commonFriends="10 common friends"
        price="10 - 100 Kc"
        description="Hi everyone, I'm offering 0.15 BTC for sale. I've been trading on Vexl for a while now and already completed several successful exchanges with other members here."
        details={[
          'In cash',
          'Vinohrady 1123',
          '\u{1F1EC}\u{1F1E7} \u{1F1E8}\u{1F1FF}',
        ]}
      />

      <SectionLabel>Club</SectionLabel>
      <OfferCard
        avatar={<ClubAvatar />}
        name="Direct friend"
        textTag={<TextTag variant="request" label="Request" />}
        iconTag={<IconTag variant="bitcoin" />}
        commonFriends="10 common friends"
        clubName="btc prague"
        price="10 - 100 Kc"
        description="Looking to buy 0.02 BTC, instant transfer."
        details={[
          'In cash',
          'Vinohrady 1123',
          '\u{1F1EC}\u{1F1E7} \u{1F1E8}\u{1F1FF}',
        ]}
      />

      <SectionLabel>Premium</SectionLabel>
      <OfferCard
        avatar={<PremiumAvatar />}
        name="Direct friend"
        premiumLabel="Premium"
        textTag={<TextTag variant="offer" label="Offer" />}
        iconTag={<IconTag variant="service" />}
        commonFriends="10 common friends"
        price="10 - 100 Kc"
        description="Hi everyone, I'm offering 0.15 BTC for sale. I've been trading on Vexl for a while now and already completed several successful exchanges with other members here."
        details={['In cash', 'Vinohrady 1123', '\u{1F1EC}\u{1F1E7}']}
      />

      <SectionLabel>My request (no avatar)</SectionLabel>
      <OfferCard
        name="Me"
        textTag={<TextTag variant="request" label="Request" />}
        iconTag={<IconTag variant="bitcoin" />}
        price="10 - 100 Kc"
        description="Looking to buy around 0.03-0.05 BTC in the next few days. I'm based in Prague and would prefer to meet in person."
        details={['In cash', 'Vinohrady 1123', '\u{1F1F5}\u{1F1FE}']}
      />

      <SectionLabel>Pressable</SectionLabel>
      <OfferCard
        avatar={<AnonAvatar />}
        name="Direct friend"
        textTag={<TextTag variant="request" label="Request" />}
        iconTag={<IconTag variant="bitcoin" />}
        commonFriends="5 common friends"
        price="0.5 - 1 BTC"
        description="Quick trade, Prague area."
        details={['Bank transfer', 'Prague 1', '\u{1F1E8}\u{1F1FF}']}
        onPress={() => {}}
      />
    </YStack>
  )
}

export function OfferCardScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack
        flex={1}
        padding="$5"
        gap="$7"
        backgroundColor="$backgroundPrimary"
      >
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          letterSpacing="$3"
          color="$foregroundPrimary"
        >
          OfferCard
        </SizableText>

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$5"
          letterSpacing="$5"
          color="$foregroundPrimary"
        >
          Light
        </SizableText>
        <Demos />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$5"
          letterSpacing="$5"
          color="$foregroundPrimary"
        >
          Dark
        </SizableText>
        <Theme name="dark">
          <YStack
            gap="$4"
            padding="$5"
            borderRadius="$5"
            backgroundColor="$backgroundPrimary"
          >
            <Demos />
          </YStack>
        </Theme>
      </YStack>
    </ScrollView>
  )
}
