import {CommonFriends} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {MarketplaceScene} from '../../shared/MarketplaceScene'
import {OfferFormScene} from '../../shared/OfferFormScene'
import {
  OfferDetailScene,
  SendMessageScene,
  type DetailedOffer,
} from '../../shared/OfferScenes'
import {typedAt} from '../../shared/playback'
import type {AnimationOffer} from '../config'
import type {MarketplaceScroll, SceneProps} from '../script'

const friendNames = [
  'Petra',
  'Tomáš',
  'Jana',
  'Martin',
  'Eva',
  'Lukáš',
  'Klára',
  'Ondřej',
  'Tereza',
  'Jakub',
]

const detailedOffer = (offer: AnimationOffer): DetailedOffer => ({
  ...offer,
  mine: false,
  iconTag: 'bitcoin',
  details: ['Cash', offer.location],
  paymentMethod: 'Cash',
})

function scrolledToOfferId(
  scroll: MarketplaceScroll,
  offers: readonly [AnimationOffer, ...AnimationOffer[]],
  chosen: AnimationOffer
): string | undefined {
  switch (scroll) {
    case 'top':
      return undefined
    case 'down':
      return Array.lastNonEmpty(offers).id
    case 'chosen':
      return chosen.id
  }
}

export function BrowseScene(props: SceneProps): React.JSX.Element {
  const {script, at, playhead} = props
  const offers = props.script.offers
  const chosen = props.script.chosenOffer
  return (
    <MarketplaceScene
      tab="all"
      offers={Array.map(offers, detailedOffer)}
      scrolledToOfferId={scrolledToOfferId(
        script.scroll(playhead),
        offers,
        chosen
      )}
      tappedOfferId={at('tapChosenOffer') ? chosen.id : undefined}
      tapNewOffer={at('tapNewOffer')}
    />
  )
}

export function AddOfferScene({
  config,
  script,
  at,
  playhead,
}: SceneProps): React.JSX.Element {
  return (
    <OfferFormScene
      at={at}
      playhead={playhead}
      offer={config.myOffer}
      description={script.typing.offerDescription}
    />
  )
}

export function ChosenOfferDetailScene(props: SceneProps): React.JSX.Element {
  const offer = props.script.chosenOffer
  return (
    <OfferDetailScene
      offer={detailedOffer(offer)}
      connection={
        <CommonFriends
          label={`${offer.commonFriends} common`}
          friends={pipe(
            friendNames,
            Array.take(offer.commonFriends),
            Array.map((name) => ({id: name, name}))
          )}
        />
      }
      tapSendMessage={props.at('tapSendMessage')}
    />
  )
}

export function RequestScene(props: SceneProps): React.JSX.Element {
  const {script, at, playhead} = props
  return (
    <SendMessageScene
      offer={detailedOffer(props.script.chosenOffer)}
      message={typedAt(script.typing.request, playhead)}
      tapSend={at('tapSendRequest')}
    />
  )
}
