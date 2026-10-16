import {PinGeolocation, Typography, useTheme, XStack} from '@vexl-next/ui'
import type {Demo} from '../shared/DemoPlayer'
import {MarketplaceScene} from '../shared/MarketplaceScene'
import {OfferDetailScene, SendMessageScene} from '../shared/OfferScenes'
import {PhoneScreens} from '../shared/PhoneScreens'
import {typedAt} from '../shared/playback'
import {PushNotification} from '../shared/PushNotification'
import {ChatScene} from './ChatScene'
import {LockScreen, ScreenOff} from './LockScreen'
import {MyOfferDetailScene} from './MyOfferDetailScene'
import './nearby.css'
import {
  cues,
  focus,
  myOffers,
  nearbyOffer,
  request,
  themScreens,
  timelineTimes,
  youScreens,
  type Cue,
  type ThemScreen,
  type YouScreen,
} from './script'

type At = (cue: Cue) => boolean

/** Bluetooth waves spreading from your phone while it shares the offer. */
function NearbyWaves(): React.JSX.Element {
  return (
    <div className="nearby-waves">
      <span />
      <span />
      <span />
    </div>
  )
}

/** Shown on the offer detail instead of common friends. */
function NearbyExplanation(): React.JSX.Element {
  const theme = useTheme()
  return (
    <XStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      padding="$5"
      gap="$1"
      alignItems="center"
    >
      <PinGeolocation size={18} color={theme.foregroundSecondary.get()} />
      <Typography variant="micro" color="$foregroundSecondary" flex={1}>
        Shared over Bluetooth by someone near you. What does this mean?
      </Typography>
    </XStack>
  )
}

function youScreen(screen: YouScreen, at: At): React.ReactNode {
  switch (screen) {
    case 'myOffers':
      return (
        <MarketplaceScene
          tab="mine"
          offers={myOffers}
          tappedOfferId={at('youTapOffer') ? nearbyOffer.id : undefined}
        />
      )
    case 'myOfferDetail':
      return (
        <MyOfferDetailScene
          state={{
            tapSwitch: at('youTapSwitch'),
            confirming: at('confirmOpen'),
            tapConfirm: at('youTapConfirm'),
            sharing: at('sharing'),
          }}
        />
      )
    case 'chat':
      return <ChatScene side="you" />
  }
}

function themScreen(
  screen: ThemScreen,
  at: At,
  playhead: number
): React.ReactNode {
  switch (screen) {
    case 'lock':
      return (
        <LockScreen
          notified={at('themNotified')}
          tapNotification={at('themTapNotification')}
        />
      )
    case 'offerDetail':
      return (
        <OfferDetailScene
          offer={nearbyOffer}
          connection={<NearbyExplanation />}
          tapSendMessage={at('themTapSendMessage')}
        />
      )
    case 'sendMessage':
      return (
        <SendMessageScene
          offer={nearbyOffer}
          message={typedAt(request, playhead)}
          tapSend={at('themTapSend')}
        />
      )
    case 'chat':
      return <ChatScene side="them" />
  }
}

/** You share an offer over Bluetooth; a stranger nearby finds it and writes to you. */
export const nearbyDemo: Demo = {
  steps: [
    {
      title: 'Share nearby',
      text: 'Your offer is already posted to your network. Turn on Share with people nearby and confirm: anyone close to you can read it, even people who don’t use Vexl.',
      start: 0,
    },
    {
      title: 'Broadcast a key',
      text: 'The offer stays encrypted on Vexl’s server, as always. Your phone only broadcasts a short key over Bluetooth.',
      start: cues.sharing,
    },
    {
      title: 'Pick it up',
      text: 'Their phone has Receive nearby offers on and catches the key even while locked. With it, it fetches the offer from the server and decrypts it.',
      start: cues.themWake - 600,
    },
    {
      title: 'Open the offer',
      text: 'It shows up as Nearby. There are no common friends behind it, so neither of you knows who the other is.',
      start: cues.themTapNotification - 300,
    },
    {
      title: 'Chat as usual',
      text: 'The request and the chat go through Vexl’s servers, end-to-end encrypted, like any other. Bluetooth only found the offer.',
      start: cues.themTapSendMessage - 300,
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
            render={(screen) => youScreen(screen, at)}
          />
          {at('youNotified') && !at('youChatOpen') ? (
            <PushNotification tap={at('youTapNotification')} />
          ) : null}
        </>
      ),
      them: (
        <>
          <PhoneScreens
            playhead={playhead}
            screens={themScreens}
            render={(screen) => themScreen(screen, at, playhead)}
          />
          {at('themAwake') ? null : <ScreenOff waking={at('themWake')} />}
        </>
      ),
    }
  },
  halos: (playhead) => ({
    you: playhead >= cues.sharing ? <NearbyWaves /> : null,
  }),
}
