import {
  Avatar,
  avatarsSvg,
  OfferAuthorBanner,
  offerAuthorBannerAvatarSize,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png')
const AnonymousAvatarSvg = avatarsSvg[2]

function AnonymousAvatar(): React.JSX.Element {
  return (
    <Avatar customSize={offerAuthorBannerAvatarSize}>
      {AnonymousAvatarSvg ? (
        <AnonymousAvatarSvg size={offerAuthorBannerAvatarSize} />
      ) : null}
    </Avatar>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <OfferAuthorBanner
        avatar={<AnonymousAvatar />}
        name="Friend of friend"
        textTagVariant="offer"
        textTagLabel="Has"
        iconTagVariant="bitcoin"
        commonFriendsLabel="3 common friends"
      />
      <OfferAuthorBanner
        avatar={<AnonymousAvatar />}
        name="Friend"
        textTagVariant="request"
        textTagLabel="Wants"
        iconTagVariant="product"
        clubLabel="Prague Bitcoiners"
        commonFriendsLabel="12 common friends"
      />
      <OfferAuthorBanner
        avatar={
          <Avatar
            customSize={offerAuthorBannerAvatarSize}
            source={testAvatar}
          />
        }
        name="Me"
        textTagVariant="offer"
        textTagLabel="I have"
        iconTagVariant="service"
        clubLabel="Multiple clubs"
      />
    </YStack>
  )
}

export function OfferAuthorBannerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Offer Author Banner" demos={Demos} />
}
