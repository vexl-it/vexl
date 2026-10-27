import {
  Button,
  Checkmark,
  ChevronLeft,
  MarketplaceMapPin,
  NavigationBar,
  PinGeolocation,
  Screen,
  SearchBar,
  Stack,
  TextField,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe, String} from 'effect'
import ReactConfetti from 'react-confetti'
import Svg, {Line, Path, Rect} from 'react-native-svg'
import {AnonymousAvatar} from '../../shared/chat'
import {ChecklistHub, ChecklistPage, TimeOptions} from '../../shared/checklist'
import {noop} from '../../shared/noop'
import {Tap} from '../../shared/Tap'
import {useValueAtom} from '../../shared/useValueAtom'
import type {AppAnimationConfig} from '../config'
import type {SceneProps} from '../script'

/** The suggested meeting time, as the app formats it in English. */
export const meetingTimeLabel = ({
  weekday,
  dateLabel,
  time,
}: AppAnimationConfig['meeting']): string =>
  `${weekday.slice(0, 3)}, ${dateLabel}, ${time}`

export function MeetingChecklistScene({
  config,
  at,
}: SceneProps): React.JSX.Element {
  return (
    <ChecklistHub
      dateAndTime={{
        tap: at('tapDateAndTime'),
        queued: at('dateQueued') ? meetingTimeLabel(config.meeting) : undefined,
      }}
      location={{
        tap: at('tapMeetingLocation'),
        queued: at('locationQueued') ? config.meeting.place : undefined,
      }}
      tapSend={at('tapChecklistSend')}
    />
  )
}

export function DateTimeScene({config, at}: SceneProps): React.JSX.Element {
  return (
    <TimeOptions
      weekday={config.meeting.weekday}
      dateLabel={config.meeting.dateLabel}
      slots={[config.meeting.time]}
      picked={[at('tapTimeSlot')]}
      saved={at('tapSlotsSave')}
      tapContinue={at('tapDateTimeContinue')}
    />
  )
}

const title = 'Meeting location'

/** The location search, filtered down to the place. */
function LocationSearch({
  name,
  area,
  tap,
}: {
  name: string
  area: string
  tap: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const queryAtom = useValueAtom(name)
  return (
    <ChecklistPage title={title}>
      <YStack gap="$5">
        <SearchBar valueAtom={queryAtom} placeholder="Add city or district" />
        <Tap on={tap}>
          <XStack alignItems="flex-start" gap="$4" pt="$5">
            <Stack pt="$1">
              <PinGeolocation size={24} color={theme.foregroundPrimary.get()} />
            </Stack>
            <YStack
              flex={1}
              gap="$2"
              pb="$5"
              borderBottomWidth={1}
              borderBottomColor="$backgroundTertiary"
            >
              <Typography variant="paragraphSmall" color="$foregroundPrimary">
                {name}
              </Typography>
              {area === '' ? null : (
                <Typography variant="description" color="$foregroundSecondary">
                  {area}
                </Typography>
              )}
            </YStack>
          </XStack>
        </Tap>
      </YStack>
    </ChecklistPage>
  )
}

type Segment = readonly [x1: number, y1: number, x2: number, y2: number]

// Streets of a made-up neighborhood, in a 390×560 map.
const streets: readonly Segment[] = [
  [-20, 90, 410, 60],
  [-20, 300, 410, 340],
  [-20, 470, 410, 520],
  [70, -20, 110, 580],
  [250, -20, 300, 580],
]
const alleys: readonly Segment[] = [
  [-20, 200, 250, 190],
  [110, 400, 410, 420],
  [180, -20, 170, 300],
  [350, 60, 330, 580],
]

const lines = (
  segments: readonly Segment[],
  width: number,
  color: string
): React.JSX.Element[] =>
  pipe(
    segments,
    Array.map(([x1, y1, x2, y2]) => (
      <Line
        key={`${x1},${y1}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    ))
  )

function FakeMap(): React.JSX.Element {
  const theme = useTheme()
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect width={390} height={560} fill={theme.backgroundSecondary.get()} />
      <Path
        d="M120 362a12 12 0 0 1 12-12h86a12 12 0 0 1 12 12v76a12 12 0 0 1-12 12h-86a12 12 0 0 1-12-12z"
        fill={theme.greenBackground.get()}
        opacity={0.5}
      />
      {lines(alleys, 6, theme.backgroundTertiary.get())}
      {lines(streets, 12, theme.backgroundHighlight.get())}
    </Svg>
  )
}

/** The map with the picked place under the pin. */
function LocationMap({
  place,
  tapSave,
}: {
  place: string
  tapSave: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const noteAtom = useValueAtom('')
  return (
    <Screen
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={title}
          leftAction={{icon: ChevronLeft, onPress: noop}}
        />
      }
      footer={
        <YStack gap="$4" pb="$5">
          <TextField valueAtom={noteAtom} placeholder="Add note..." showClear />
          <Tap on={tapSave}>
            <Button onPress={noop}>Save</Button>
          </Tap>
        </YStack>
      }
    >
      <Stack flex={1} overflow="hidden" className="demo-fade-in">
        <Stack position="absolute" top={0} right={0} bottom={0} left={0}>
          <FakeMap />
        </Stack>
        <YStack px="$5" pb="$4" backgroundColor="$backgroundPrimary">
          <SearchBar variant="dummy" placeholder="Search" onPress={noop} />
        </YStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$2"
          px="$13"
        >
          <YStack
            px="$4"
            py="$3"
            borderRadius="$5"
            backgroundColor="$accentHighlightPrimary"
          >
            <Typography
              variant="description"
              color="$backgroundPrimary"
              textAlign="center"
            >
              {place}
            </Typography>
          </YStack>
          <MarketplaceMapPin
            color={theme.accentYellowPrimary.get()}
            centerColor={theme.backgroundPrimary.get()}
          />
        </YStack>
      </Stack>
    </Screen>
  )
}

/** "Meeting location": search the place, check it on the map, save. */
export function MeetingLocationScene({
  config,
  at,
}: SceneProps): React.JSX.Element {
  const [name = '', ...area] = pipe(
    config.meeting.place,
    String.split(','),
    Array.map(String.trim)
  )
  return at('placePicked') ? (
    <LocationMap place={config.meeting.place} tapSave={at('tapLocationSave')} />
  ) : (
    <LocationSearch
      name={name}
      area={Array.join(area, ', ')}
      tap={at('tapPlace')}
    />
  )
}

const phone = {width: 390, height: 844}
const avatarSize = 96

/** Not an app screen: a celebration closing the trade. */
export function MeetingSuccessScene({config}: SceneProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <Stack flex={1} backgroundColor="$backgroundPrimary">
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$8"
        px="$8"
      >
        <Stack>
          <XStack>
            <AnonymousAvatar side="them" size={avatarSize} />
            <Stack ml="$-5">
              <AnonymousAvatar side="you" size={avatarSize} />
            </Stack>
          </XStack>
          <Stack
            position="absolute"
            bottom="$-4"
            alignSelf="center"
            width="$11"
            height="$11"
            borderRadius="$11"
            borderWidth={4}
            borderColor="$backgroundPrimary"
            backgroundColor="$accentYellowPrimary"
            alignItems="center"
            justifyContent="center"
          >
            <Checkmark size={28} color={theme.black100.get()} />
          </Stack>
        </Stack>
        <YStack gap="$4" alignItems="center">
          <Typography
            variant="heading2"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {config.success.title}
          </Typography>
          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {config.success.text}
          </Typography>
        </YStack>
      </YStack>
      <ReactConfetti
        width={phone.width}
        height={phone.height}
        recycle={false}
        numberOfPieces={350}
        tweenDuration={400}
        confettiSource={{x: phone.width / 2, y: phone.height * 0.4, w: 0, h: 0}}
        initialVelocityX={9}
        initialVelocityY={24}
        gravity={0.25}
        // A canvas can't resolve the CSS variables `.get()` returns on the web.
        colors={[
          theme.accentYellowPrimary.val,
          theme.accentHighlightSecondary.val,
          theme.vibrantPinkBackground.val,
          theme.greenForeground.val,
          theme.foregroundPrimary.val,
        ]}
      />
    </Stack>
  )
}
