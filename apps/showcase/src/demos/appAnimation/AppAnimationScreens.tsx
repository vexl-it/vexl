import {PhoneScreens} from '../shared/PhoneScreens'
import type {AppAnimationConfig} from './config'
import {ApprovedNotification, ChatScene} from './scenes/ChatScenes'
import {EndScene} from './scenes/EndScene'
import {
  DateTimeScene,
  MeetingChecklistScene,
  MeetingLocationScene,
  MeetingSuccessScene,
} from './scenes/MeetingScenes'
import {
  AddOfferScene,
  BrowseScene,
  ChosenOfferDetailScene,
  RequestScene,
} from './scenes/OfferScenes'
import {ContactsImportScene, PhoneNumberScene} from './scenes/OnboardingScenes'
import type {AppAnimationScript, AppScreen, At, SceneProps} from './script'

function Scene({
  screen,
  ...props
}: SceneProps & {screen: AppScreen}): React.JSX.Element {
  switch (screen) {
    case 'phoneNumber':
      return <PhoneNumberScene {...props} />
    case 'contactsImport':
      return <ContactsImportScene {...props} />
    case 'marketplace':
      return <BrowseScene {...props} />
    case 'offerForm':
      return <AddOfferScene {...props} />
    case 'offerDetail':
      return <ChosenOfferDetailScene {...props} />
    case 'sendMessage':
      return <RequestScene {...props} />
    case 'chat':
      return <ChatScene {...props} />
    case 'checklist':
      return <MeetingChecklistScene {...props} />
    case 'dateTime':
      return <DateTimeScene {...props} />
    case 'location':
      return <MeetingLocationScene {...props} />
    case 'success':
      return <MeetingSuccessScene {...props} />
    case 'end':
      return <EndScene />
  }
}

/** The phone's screen at `playhead`. */
export function AppAnimationScreens({
  config,
  script,
  playhead,
}: {
  config: AppAnimationConfig
  script: AppAnimationScript
  playhead: number
}): React.JSX.Element {
  const at: At = (cue) => playhead >= script.cues[cue]
  const props = {config, script, at, playhead}
  return (
    <>
      <PhoneScreens
        playhead={playhead}
        screens={script.screens}
        render={(screen) => <Scene screen={screen} {...props} />}
      />
      {at('approvedNotification') && !at('approved') ? (
        <ApprovedNotification {...props} />
      ) : null}
    </>
  )
}
