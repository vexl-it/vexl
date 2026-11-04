'use client'

import {IconTag, OfferCard, TextTag} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../../../components/LocaleProvider'
import {type Messages} from '../../../i18n/en'
import {DemoAvatar, type DemoAvatarIndex} from './DemoAvatar'

export type DemoOffer = Messages['home']['mock']['offers'][number]

export function DemoOfferCard({
  offer,
  avatar,
}: {
  readonly offer: DemoOffer
  readonly avatar: DemoAvatarIndex
}): React.JSX.Element {
  const {t} = useLocale()
  const mock = t.home.mock
  const selling = offer.side === 'sell'

  return (
    <OfferCard
      avatar={<DemoAvatar index={avatar} size={36} />}
      name={offer.direct ? mock.directFriend : mock.friendOfFriend}
      textTag={
        <TextTag
          variant={selling ? 'offer' : 'request'}
          label={selling ? mock.has : mock.wants}
        />
      }
      iconTag={<IconTag variant="bitcoin" />}
      commonFriends={offer.commonFriends}
      trustedFriends={'trusted' in offer ? offer.trusted : undefined}
      price={offer.price}
      description={offer.description}
      details={[mock.cash, offer.place]}
    />
  )
}
