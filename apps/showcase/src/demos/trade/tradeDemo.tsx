import type {Demo} from '../shared/DemoPlayer'
import {PhoneScreens} from '../shared/PhoneScreens'
import {
  CalculateAmountScene,
  ChecklistHubScene,
  TimeOptionsScene,
} from './scenes/AgreeScenes'
import {MarketplaceScene} from './scenes/MarketplaceScene'
import {OfferFormScene} from './scenes/OfferFormScene'
import {OfferDetailScene, SendMessageScene} from './scenes/OfferScenes'
import {PushNotification} from './scenes/PushNotification'
import {
  ConfirmAmountScene,
  PickDateScene,
  PickTimeScene,
} from './scenes/RespondScenes'
import {TradeChatScene} from './scenes/TradeChatScene'
import {
  cues,
  focus,
  themScreens,
  timelineTimes,
  typing,
  youScreens,
  type Cue,
  type ThemScreen,
  type YouScreen,
} from './script'

export type At = (cue: Cue) => boolean

function youScreen(
  screen: YouScreen,
  at: At,
  playhead: number
): React.ReactNode {
  switch (screen) {
    case 'myOffers':
      return (
        <MarketplaceScene
          tab="mine"
          newOffer={at('published')}
          tapNewOffer={at('youTapNewOffer')}
        />
      )
    case 'form':
      return <OfferFormScene at={at} playhead={playhead} />
    case 'chat':
      return <TradeChatScene side="you" at={at} playhead={playhead} />
    case 'pickDate':
      return <PickDateScene at={at} />
    case 'pickTime':
      return <PickTimeScene at={at} />
    case 'confirmAmount':
      return <ConfirmAmountScene at={at} />
  }
}

function themScreen(
  screen: ThemScreen,
  at: At,
  playhead: number
): React.ReactNode {
  switch (screen) {
    case 'marketplace':
      return (
        <MarketplaceScene
          tab="all"
          newOffer={at('offerArrives')}
          tapOffer={at('themTapOffer')}
        />
      )
    case 'offerDetail':
      return <OfferDetailScene tapSendMessage={at('themTapSendMessage')} />
    case 'sendMessage':
      return (
        <SendMessageScene
          playhead={playhead}
          tapSend={at('themTapSendRequest')}
        />
      )
    case 'chat':
      return <TradeChatScene side="them" at={at} playhead={playhead} />
    case 'hub':
      return <ChecklistHubScene at={at} />
    case 'times':
      return <TimeOptionsScene at={at} />
    case 'amount':
      return <CalculateAmountScene at={at} playhead={playhead} />
  }
}

/** Seller and buyer, from posting an offer to agreeing on the meeting. */
export const tradeDemo: Demo = {
  steps: [
    {
      title: 'Create an offer',
      text: 'Pick what you trade, the amount, where you meet and how you pay. Only your contacts and their contacts will see it.',
      start: 0,
    },
    {
      title: 'Send a request',
      text: 'A friend of a friend finds the offer, sees you have 3 friends in common and sends a message.',
      start: cues.offerArrives,
    },
    {
      title: 'Accept',
      text: 'Nobody can chat with you until you accept. Until then you can check the offer and your common friends.',
      start: cues.youNotified,
    },
    {
      title: 'Chat',
      text: 'Messages are end-to-end encrypted. Neither of you knows who the other is.',
      start: typing.youReply.start - 300,
    },
    {
      title: 'Agree on time and amount',
      text: 'The trade checklist sends suggestions to the other phone. They accept a time slot and the amount, and the meeting is set.',
      start: cues.themTapChecklist - 300,
    },
  ],
  times: timelineTimes,
  end: cues.end,
  focus,
  phones: (playhead) => {
    const at: At = (cue) => playhead >= cues[cue]
    return {
      you: (
        <>
          <PhoneScreens
            playhead={playhead}
            screens={youScreens}
            render={(screen) => youScreen(screen, at, playhead)}
          />
          {at('youNotified') && !at('youChatOpen') ? (
            <PushNotification tap={at('youTapNotification')} />
          ) : null}
        </>
      ),
      them: (
        <PhoneScreens
          playhead={playhead}
          screens={themScreens}
          render={(screen) => themScreen(screen, at, playhead)}
        />
      ),
    }
  },
}
