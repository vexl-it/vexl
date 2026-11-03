import {
  Avatar,
  avatarsSvg,
  ChatBubbles,
  IconTag,
  OfferCard,
  TextTag,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

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

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Basic request">
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
            {text: 'en, cs', icon: ChatBubbles},
          ]}
        />
      </DemoSection>
      <DemoSection title="Basic offer (long description)">
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
      </DemoSection>
      <DemoSection title="Club">
        <OfferCard
          avatar={<ClubAvatar />}
          name="Direct friend"
          textTag={<TextTag variant="request" label="Request" />}
          iconTag={<IconTag variant="bitcoin" />}
          commonFriends="10 common friends"
          clubNames={['btc prague']}
          price="10 - 100 Kc"
          description="Looking to buy 0.02 BTC, instant transfer."
          details={[
            'In cash',
            'Vinohrady 1123',
            '\u{1F1EC}\u{1F1E7} \u{1F1E8}\u{1F1FF}',
          ]}
        />
      </DemoSection>
      <DemoSection title="Trusted">
        <OfferCard
          avatar={<AnonAvatar />}
          name="Friend of friend"
          textTag={<TextTag variant="offer" label="Has" />}
          iconTag={<IconTag variant="bitcoin" />}
          commonFriends="5 common friends"
          trustedFriends="2 trusted"
          price="0.5 - 1 BTC"
          description="Quick trade, Prague area."
          details={['In cash', 'Prague']}
        />
      </DemoSection>
      <DemoSection title="Club + trusted">
        <OfferCard
          avatar={<ClubAvatar />}
          name="Friend of friend"
          textTag={<TextTag variant="offer" label="Has" />}
          iconTag={<IconTag variant="bitcoin" />}
          clubNames={['btc prague meetup']}
          commonFriends="1 common"
          trustedFriends="1 trusted"
          price="0.5 - 1 BTC"
          description="Quick trade, Prague area."
          details={['In cash', 'Prague']}
        />
      </DemoSection>
      <DemoSection title="Club + trusted, German worst case">
        <YStack maxWidth={375}>
          <OfferCard
            avatar={<ClubAvatar />}
            name="Freund eines Freundes"
            textTag={<TextTag variant="offer" label="Has" />}
            iconTag={<IconTag variant="bitcoin" />}
            clubNames={['btc prague meetup']}
            commonFriends="12 Gemeinsam"
            trustedFriends="3 vertraut"
            price="0.5 - 1 BTC"
            description="Quick trade, Prague area."
            details={['In cash', 'Prague']}
          />
        </YStack>
      </DemoSection>
      <DemoSection title="Premium">
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
      </DemoSection>
      <DemoSection title="My request (no avatar)">
        <OfferCard
          name="Me"
          textTag={<TextTag variant="request" label="Request" />}
          iconTag={<IconTag variant="bitcoin" />}
          price="10 - 100 Kc"
          description="Looking to buy around 0.03-0.05 BTC in the next few days. I'm based in Prague and would prefer to meet in person."
          details={['In cash', 'Vinohrady 1123', '\u{1F1F5}\u{1F1FE}']}
        />
      </DemoSection>
      <DemoSection title="Pressable">
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
      </DemoSection>
    </>
  )
}

export function OfferCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Offer Card" demos={Demos} />
}
