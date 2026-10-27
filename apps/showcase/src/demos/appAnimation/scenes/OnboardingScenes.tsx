import {
  Button,
  ContactsGraphic,
  FaqStayAnonymous,
  ProgressDialog,
  Stack,
  Typography,
  useTheme,
  VexlTextGraphic,
  XStack,
  YStack,
  type ProgressDialogProps,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import type {ReactNode} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {Path} from 'react-native-svg'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {Tap} from '../../shared/Tap'
import type {At, SceneProps} from '../script'

function PhonePadKey({
  label,
  letters,
  pressedAt,
  plain = false,
}: {
  label: ReactNode
  letters?: string
  /** Changes on every press of this key, so the highlight replays. */
  pressedAt?: number | undefined
  plain?: boolean
}): React.JSX.Element {
  return (
    <YStack
      flex={1}
      flexBasis={0}
      height="$10"
      borderRadius="$2.5"
      alignItems="center"
      justifyContent="center"
      backgroundColor={plain ? '$transparent' : '$backgroundHighlight'}
      zIndex={0}
    >
      {pressedAt === undefined ? null : (
        <Stack
          key={pressedAt}
          className="demo-fade-out"
          position="absolute"
          inset={0}
          zIndex={-1}
          borderRadius="$2.5"
          backgroundColor="$foregroundSecondary"
        />
      )}
      {typeof label === 'string' ? (
        <Typography variant="titles" color="$foregroundPrimary">
          {label}
        </Typography>
      ) : (
        label
      )}
      {letters === undefined ? null : (
        <Typography
          variant="micro"
          fontWeight="700"
          letterSpacing={2}
          color="$foregroundPrimary"
        >
          {/* A space keeps the 1 key's digit level with the others. */}
          {letters || ' '}
        </Typography>
      )}
    </YStack>
  )
}

function DeleteIcon(): React.JSX.Element {
  const theme = useTheme()
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 5H20a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H8.5L2.5 12zM11.5 9l6 6M17.5 9l-6 6"
        stroke={theme.foregroundPrimary.get()}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  )
}

const digitLetters = [
  '',
  'ABC',
  'DEF',
  'GHI',
  'JKL',
  'MNO',
  'PQRS',
  'TUV',
  'WXYZ',
]

/** The iOS phone-pad keyboard, highlighting the last key `typed`. */
function PhonePad({typed}: {typed: string}): React.JSX.Element {
  const pressedAt = (digit: string): number | undefined =>
    typed.endsWith(digit) ? typed.length : undefined
  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      padding="$3"
      paddingBottom="$13"
      gap="$3"
    >
      {pipe(
        digitLetters,
        Array.map((letters, index) => ({digit: String(index + 1), letters})),
        Array.chunksOf(3),
        Array.map((row, index) => (
          <XStack key={index} gap="$3">
            {Array.map(row, ({digit, letters}) => (
              <PhonePadKey
                key={digit}
                label={digit}
                letters={letters}
                pressedAt={pressedAt(digit)}
              />
            ))}
          </XStack>
        ))
      )}
      <XStack gap="$3">
        <PhonePadKey label="+*#" plain />
        <PhonePadKey label="0" letters="+" pressedAt={pressedAt('0')} />
        <PhonePadKey label={<DeleteIcon />} plain />
      </XStack>
    </YStack>
  )
}

/** Typed digits filled into the number's groups, padded with zeros like the app. */
function PhoneNumberGroups({
  number,
  typed,
}: {
  number: string
  typed: string
}): React.JSX.Element {
  const [, groups] = Array.mapAccum(number.split(' '), 0, (offset, group) => {
    const length = group.replace(/\D/g, '').length
    return [
      offset + length,
      {length, value: typed.slice(offset, offset + length)},
    ]
  })
  return (
    <>
      {Array.map(groups, ({length, value}, index) => (
        <Typography
          key={index}
          variant="heading3"
          color={value ? '$foregroundPrimary' : '$foregroundSecondary'}
        >
          {value.padEnd(length, '0')}
        </Typography>
      ))}
    </>
  )
}

/** Login: the phone number, typed on the phone pad, footer above the keyboard. */
/** The app's first screen, as LoginFlow's Intro1Screen shows it. */
export function WelcomeScene({config, at}: SceneProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundPrimary"
      paddingTop={Math.max(insets.top, 20)}
      paddingBottom={Math.max(insets.bottom, 16)}
      paddingHorizontal="$5"
    >
      <Stack alignItems="center" mt="$5">
        <VexlTextGraphic
          variant={config.appearance === 'dark' ? 'light' : 'dark'}
          animate
          height={27}
        />
      </Stack>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$9">
        <FaqStayAnonymous
          variant={config.appearance}
          animate
          width={330}
          height={236}
        />
        <YStack gap="$4" width="100%">
          <Typography
            variant="heading3"
            color="$foregroundPrimary"
            textAlign="center"
          >
            Take back your freedom to transact
          </Typography>
          <Typography
            variant="paragraphSmall"
            color="$foregroundSecondary"
            textAlign="center"
          >
            Trade bitcoin with people you know. No one watching.
          </Typography>
        </YStack>
      </YStack>
      <YStack gap="$4">
        <Typography
          variant="paragraphSmall"
          color="$foregroundPrimary"
          textAlign="center"
        >
          By continuing, you agree to Vexl{' '}
          <Typography
            variant="paragraphSmall"
            color="$accentYellowPrimary"
            textDecorationLine="underline"
          >
            Terms of use
          </Typography>
          .
        </Typography>
        <Tap on={at('tapGetStarted')}>
          <Button onPress={noop} width="100%">
            Get started
          </Button>
        </Tap>
      </YStack>
    </YStack>
  )
}

export function PhoneNumberScene({
  config,
  script,
  at,
  playhead,
}: SceneProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const typed = typedAt(script.typing.phoneDigits, playhead)
  const complete = typed === script.typing.phoneDigits.text
  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      <YStack
        flex={1}
        paddingTop={Math.max(insets.top, 20)}
        paddingHorizontal="$5"
      >
        <YStack gap="$10" paddingTop="$11">
          <YStack gap="$4">
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              textAlign="center"
            >
              What’s your phone number?
            </Typography>
            <Typography
              variant="paragraphSmall"
              color="$foregroundSecondary"
              textAlign="center"
            >
              Your number stays private unless you choose to share it.
            </Typography>
          </YStack>
          <XStack gap="$4" alignItems="center" justifyContent="center">
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              textDecorationLine="underline"
            >
              {config.phone.callingCode}
            </Typography>
            <PhoneNumberGroups number={config.phone.number} typed={typed} />
          </XStack>
        </YStack>
      </YStack>
      <YStack
        gap="$4"
        paddingHorizontal="$5"
        paddingBottom={Math.max(insets.bottom, 16)}
      >
        <Typography
          variant="paragraphSmall"
          color="$foregroundSecondary"
          textAlign="center"
        >
          We’ll text you a code to confirm it’s really you.
        </Typography>
        <Tap on={at('tapPhoneContinue')}>
          <Button disabled={!complete} onPress={noop} width="100%">
            Continue
          </Button>
        </Tap>
      </YStack>
      <PhonePad typed={typed} />
    </YStack>
  )
}

const contactsTotal = 248
const canTakeAWhile = 'Keep Vexl open. This can take a while.'

const addingContacts = (
  percentage: number
): Omit<ProgressDialogProps, 'visible'> => ({
  title: 'Adding contacts',
  belowProgressLeft: `${Math.round((contactsTotal * percentage) / 100)} of ${contactsTotal} contacts`,
  belowProgressRight: `${percentage}% done`,
  bottomText: canTakeAWhile,
  indicateProgress: {type: 'progress', percentage},
})

/** The contact import progress dialog the app shows after "Set up now". */
function importProgress(at: At): Omit<ProgressDialogProps, 'visible'> {
  if (at('contactsImported'))
    return {
      title: 'Contacts are up to date',
      belowProgressLeft: 'Contacts updated',
      belowProgressRight: 'Done',
      bottomText: 'Your network is ready.',
      indicateProgress: {type: 'done'},
    }
  if (at('contactsMostlyAdded')) return addingContacts(85)
  if (at('addingContacts')) return addingContacts(40)
  return {
    title: 'Reading contacts',
    bottomText: canTakeAWhile,
    indicateProgress: {type: 'loader'},
  }
}

/** Post login: find friends by importing contacts. */
export function ContactsImportScene({
  config,
  at,
}: SceneProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const importing = at('importingContacts')
  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundPrimary"
      justifyContent="space-between"
      paddingTop={Math.max(insets.top, 20)}
      paddingBottom={Math.max(insets.bottom, 16)}
      paddingHorizontal="$5"
    >
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$9">
        <ContactsGraphic
          variant={config.appearance}
          animate
          disableReplayOnPress
        />
        <YStack alignItems="center" gap="$4">
          <Typography
            variant="heading3"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {'You’re in!\nLet’s find friends on Vexl'}
          </Typography>
          <Typography
            variant="paragraphSmall"
            color="$foregroundSecondary"
            textAlign="center"
          >
            Vexl works through real connections — friends and friends of
            friends. Import your contacts to see who’s already here.
          </Typography>
        </YStack>
      </YStack>
      <XStack gap="$3">
        <Button
          variant="secondary"
          disabled={importing}
          onPress={noop}
          flex={1}
        >
          Skip for now
        </Button>
        <Tap on={at('tapImportContacts')} flex={1}>
          <Button disabled={importing} onPress={noop}>
            Set up now
          </Button>
        </Tap>
      </XStack>
      <ProgressDialog
        visible={importing ? !at('marketplaceOpen') : false}
        {...importProgress(at)}
      />
    </YStack>
  )
}
