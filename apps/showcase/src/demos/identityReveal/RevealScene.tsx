import {
  Button,
  Disclosure,
  Image,
  NavigationBar,
  RowCheckbox,
  Screen,
  Stack,
  TextField,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {noop} from '../shared/noop'
import type {Side} from '../shared/side'
import {Tap} from '../shared/Tap'
import {useValueAtom} from '../shared/useValueAtom'
import {people} from './script'

const photoPreviewSize = 56

export interface RevealSceneState {
  readonly mode: 'request' | 'respond'
  readonly nicknameSelected: boolean
  readonly nickname: string
  readonly photoSelected: boolean
  readonly photoChosen: boolean
  readonly tap?:
    | 'nickname'
    | 'nicknameField'
    | 'photo'
    | 'choosePhoto'
    | 'submit'
    | undefined
}

function NicknameRow({
  side,
  state: {nicknameSelected, nickname, tap},
}: {
  side: Side
  state: RevealSceneState
}): React.JSX.Element {
  const nicknameAtom = useValueAtom(nickname)
  return (
    <YStack gap="$2">
      <Tap on={tap === 'nickname'}>
        <RowCheckbox
          label="Nickname"
          description={`${nickname || 'Toggle to set'} · ${people[side].anonymizedPhone}`}
          checked={nicknameSelected}
          onCheckedChange={noop}
        />
      </Tap>
      {nicknameSelected ? (
        <Tap on={tap === 'nicknameField'}>
          <TextField
            valueAtom={nicknameAtom}
            placeholder="Nickname"
            showClear
          />
        </Tap>
      ) : null}
    </YStack>
  )
}

function PhotoRow({
  side,
  state: {photoSelected, photoChosen, tap},
}: {
  side: Side
  state: RevealSceneState
}): React.JSX.Element {
  return (
    <YStack gap="$2">
      <Tap on={tap === 'photo'}>
        <RowCheckbox
          label="Profile photo"
          description={photoChosen ? undefined : 'No photo yet'}
          checked={photoSelected}
          onCheckedChange={noop}
        />
      </Tap>
      {photoSelected ? (
        <XStack ai="center" gap="$3">
          {photoChosen ? (
            <Stack className="demo-arrive">
              <Image
                borderRadius="$4"
                width={photoPreviewSize}
                height={photoPreviewSize}
                source={{uri: people[side].photo}}
              />
            </Stack>
          ) : null}
          <Tap on={tap === 'choosePhoto'}>
            <Button variant="secondary" size="small" onPress={noop}>
              {photoChosen ? 'Change photo' : 'Choose a photo'}
            </Button>
          </Tap>
        </XStack>
      ) : null}
    </YStack>
  )
}

/** The "Reveal identity" screen, asking for (`request`) or answering (`respond`) a reveal. */
export function RevealScene({
  side,
  state,
}: {
  side: Side
  state: RevealSceneState
}): React.JSX.Element {
  const respond = state.mode === 'respond'
  const canSubmit =
    (state.nicknameSelected || state.photoSelected) &&
    (!state.nicknameSelected || state.nickname !== '') &&
    (!state.photoSelected || state.photoChosen)
  return (
    <Screen
      scrollable
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title="Reveal identity"
          rightActions={[{icon: XmarkCancelClose, onPress: noop}]}
        />
      }
      footer={
        <YStack gap="$5">
          <Typography
            variant="description"
            color="$foregroundSecondary"
            textAlign="center"
          >
            Revealed only when you both agree.
          </Typography>
          <Tap on={state.tap === 'submit'}>
            <Button disabled={!canSubmit} onPress={noop}>
              {respond ? 'Accept & reveal' : 'Send reveal request'}
            </Button>
          </Tap>
        </YStack>
      }
    >
      <YStack f={1} p="$5">
        <Stack gap="$5" pt="$4">
          <YStack gap="$2">
            <Typography variant="heading3" color="$foregroundPrimary">
              {respond
                ? 'Review what you reveal'
                : 'What would you like to reveal?'}
            </Typography>
            {respond ? (
              <Typography variant="description" color="$foregroundSecondary">
                You both reveal the same details. Check yours before agreeing.
              </Typography>
            ) : null}
          </YStack>
          <YStack gap="$3">
            <NicknameRow side={side} state={state} />
            <RowCheckbox
              label="Phone number"
              description={people[side].phone}
              checked={false}
              onCheckedChange={noop}
            />
            <PhotoRow side={side} state={state} />
          </YStack>
          <Disclosure title="How revealing works">
            You both reveal the same selected details. A nickname comes with the
            phone digits shown above so you can recognise each other. The full
            number is a separate choice. Details show up only after you both
            agree. Once revealed, the other person may keep them.
          </Disclosure>
        </Stack>
      </YStack>
    </Screen>
  )
}
