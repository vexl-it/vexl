import type {SwipeableOfferCardMark} from '@vexl-next/ui'
import {
  IconTag,
  OfferCard,
  SwipeableOfferCard,
  TextTag,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const labels = {
  archive: 'Archive',
  favourite: 'Favourite',
  removeFavourite: 'Remove favourite',
  unarchive: 'Unarchive',
}

function Demos(): React.JSX.Element {
  const [mark, setMark] = useState<SwipeableOfferCardMark | undefined>()

  return (
    <YStack gap="$3">
      <Typography variant="description" color="$foregroundSecondary">
        Swipe right to favourite or left to archive. A full swipe commits the
        action immediately.
      </Typography>
      <SwipeableOfferCard
        offerId="ui-book-swipeable-offer"
        mark={mark}
        labels={labels}
        onToggleMark={(target) => {
          setMark((currentMark) =>
            currentMark === target ? undefined : target
          )
        }}
      >
        <OfferCard
          markBadge={mark}
          name="Direct friend"
          textTag={<TextTag variant="offer" label="Offer" />}
          iconTag={<IconTag variant="bitcoin" />}
          commonFriends="8 common friends"
          price="45,000 – 90,000 CZK"
          description="Selling bitcoin in person around central Prague."
          details={['In cash', 'Prague 1']}
        />
      </SwipeableOfferCard>
      <Typography variant="micro" color="$foregroundTertiary">
        Current mark: {mark ?? 'none'}
      </Typography>
    </YStack>
  )
}

export function SwipeableOfferCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Swipeable Offer Card" demos={Demos} />
}
