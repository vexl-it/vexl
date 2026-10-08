import {
  ArrowLeft,
  ArrowRight,
  BoxProduct,
  Button,
  CurrencyBitcoinCircle,
  EditRow,
  FilterTag,
  FriendLevel,
  NavigationBar,
  PlusAdd,
  PriceRangeInput,
  ProgressDialog,
  RadiobuttonCircleEmpty,
  RadiobuttonCircleFilled,
  RowButton,
  Screen,
  SegmentedPicker,
  Tools,
  TrashBin,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import type {ReactNode} from 'react'
import {Arrive} from '../../shared/chat'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {Tap} from '../../shared/Tap'
import {useValueAtom} from '../../shared/useValueAtom'
import {offer, typing} from '../script'
import type {At} from '../tradeDemo'

const czkLimit = 250_000
const locationLabel = `${offer.location}, radius of 1 km`

function ActiveStep({
  headline,
  children,
}: {
  headline: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <YStack>
      <EditRow state="initial" headline={headline} />
      <Arrive>
        <YStack gap="$5" paddingVertical="$5">
          {children}
        </YStack>
      </Arrive>
    </YStack>
  )
}

function NextButton({tap}: {tap: boolean}): React.JSX.Element {
  return (
    <Tap on={tap}>
      <Button variant="primary" size="large" onPress={noop}>
        Next
      </Button>
    </Tap>
  )
}

function NetworkRow({
  label,
  description,
  selected,
}: {
  label: string
  description: string
  selected: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightPrimary.get()
    : theme.foregroundPrimary.get()
  const textColor = selected ? '$accentHighlightPrimary' : '$foregroundPrimary'
  const Icon = selected ? RadiobuttonCircleFilled : RadiobuttonCircleEmpty
  return (
    <YStack
      backgroundColor={
        selected ? '$accentYellowSecondary' : '$backgroundSecondary'
      }
      padding="$5"
      borderRadius="$5"
      gap="$3"
    >
      <XStack gap="$3" alignItems="center">
        <Icon size={24} color={iconColor} />
        <Typography variant="paragraph" color={textColor} flex={1}>
          {label}
        </Typography>
      </XStack>
      <YStack paddingLeft="$8">
        <Typography variant="description" color={textColor}>
          {description}
        </Typography>
      </YStack>
    </YStack>
  )
}

function AmountStep({at}: {at: At}): React.JSX.Element {
  const minAtom = useValueAtom(0)
  const maxAtom = useValueAtom(at('amountMax') ? offer.maxAmount : czkLimit)
  return (
    <ActiveStep headline="Select amount">
      <PriceRangeInput
        minValueAtom={minAtom}
        maxValueAtom={maxAtom}
        currency="CZK"
        onCurrencyPress={noop}
        maxLimit={czkLimit}
        locale="cs-CZ"
      />
      <NextButton tap={at('tapAmountNext')} />
    </ActiveStep>
  )
}

function LocationStep({at}: {at: At}): React.JSX.Element {
  const theme = useTheme()
  return (
    <ActiveStep headline="Set location">
      <SegmentedPicker
        tabs={[
          {label: 'In person', value: 'IN_PERSON'},
          {label: 'Online', value: 'ONLINE'},
        ]}
        activeTab="IN_PERSON"
        onTabPress={noop}
      />
      <YStack gap="$3">
        {at('locationAdded') ? (
          <Arrive>
            <XStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              height="$11"
              pl="$5"
              pr="$4"
              alignItems="center"
            >
              <Typography
                variant="description"
                color="$foregroundPrimary"
                flex={1}
                numberOfLines={1}
              >
                {locationLabel}
              </Typography>
              <TrashBin size={24} color={theme.foregroundPrimary.get()} />
            </XStack>
          </Arrive>
        ) : null}
        <Tap on={at('tapAddLocation')}>
          <RowButton label="Add location" icon={PlusAdd} onPress={noop} />
        </Tap>
        {at('locationAdded') ? (
          <NextButton tap={at('tapLocationNext')} />
        ) : null}
      </YStack>
    </ActiveStep>
  )
}

function NetworkStep({at}: {at: At}): React.JSX.Element {
  return (
    <ActiveStep headline="Select payment details">
      <YStack gap="$3">
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          Payment type
        </Typography>
        <XStack>
          <FilterTag label="Cash" selected />
        </XStack>
      </YStack>
      <YStack gap="$3">
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          Network
        </Typography>
        <Tap on={at('tapLightning')}>
          <NetworkRow
            label="Lightning"
            description="Best for smaller amounts. Fast and cheap."
            selected={at('tapLightning')}
          />
        </Tap>
        <NetworkRow
          label="On-chain"
          description="Best for larger amounts. Slower, but more secure."
          selected={false}
        />
      </YStack>
      {at('tapLightning') ? <NextButton tap={at('tapNetworkNext')} /> : null}
    </ActiveStep>
  )
}

function DescribeStep({
  at,
  playhead,
}: {
  at: At
  playhead: number
}): React.JSX.Element {
  const description = typedAt(typing.description, playhead)
  return (
    <ActiveStep headline="Describe your offer">
      <YStack
        backgroundColor="$backgroundSecondary"
        borderRadius="$3"
        padding="$5"
        gap="$3"
        minHeight={120}
      >
        <Typography
          variant="paragraph"
          color={description ? '$foregroundPrimary' : '$foregroundTertiary'}
          flex={1}
        >
          {description || 'Write why people should accept your offer.'}
        </Typography>
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          alignSelf="flex-end"
        >
          {`${description.length}/500`}
        </Typography>
      </YStack>
      {description ? <NextButton tap={at('tapDescribeNext')} /> : null}
    </ActiveStep>
  )
}

function FriendLevelStep({at}: {at: At}): React.JSX.Element {
  const second = at('tapSecondDegree')
  return (
    <ActiveStep headline="Who can see your offer">
      <XStack flexWrap="wrap" justifyContent="center" gap="$3">
        <FriendLevel
          degree="FIRST"
          selected={!second}
          title="1st degree"
          subtitle="You reach 34 people"
        />
        <Tap on={second}>
          <FriendLevel
            degree="ALL"
            selected={second}
            title="2nd degree"
            subtitle="You reach 1 280 people"
          />
        </Tap>
      </XStack>
      <NextButton tap={at('tapFriendNext')} />
    </ActiveStep>
  )
}

function Steps({at, playhead}: {at: At; playhead: number}): React.JSX.Element {
  return (
    <>
      {at('listingDone') ? (
        <EditRow
          state="completed"
          overline="What are you here for?"
          headline="Bitcoin"
        />
      ) : (
        <ActiveStep headline="What are you here for?">
          <YStack gap="$3">
            <Tap on={at('tapBitcoin')}>
              <RowButton
                label="Bitcoin"
                icon={CurrencyBitcoinCircle}
                selected={at('tapBitcoin')}
                onPress={noop}
              />
            </Tap>
            <RowButton label="Products" icon={BoxProduct} onPress={noop} />
            <RowButton label="Services" icon={Tools} onPress={noop} />
          </YStack>
        </ActiveStep>
      )}
      {!at('listingDone') ? null : at('sellDone') ? (
        <EditRow
          state="completed"
          overline="What do you want to do?"
          headline="I want to sell bitcoin"
        />
      ) : (
        <ActiveStep headline="What do you want to do?">
          <YStack gap="$3">
            <RowButton
              label="I want to buy bitcoin"
              icon={ArrowLeft}
              onPress={noop}
            />
            <Tap on={at('tapSell')}>
              <RowButton
                label="I want to sell bitcoin"
                icon={ArrowRight}
                selected={at('tapSell')}
                onPress={noop}
              />
            </Tap>
          </YStack>
        </ActiveStep>
      )}
      {!at('sellDone') ? null : at('amountDone') ? (
        <EditRow
          state="completed"
          overline="Select amount"
          headline="0 – 10 000 CZK"
        />
      ) : (
        <AmountStep at={at} />
      )}
      {!at('amountDone') ? null : at('locationDone') ? (
        <EditRow
          state="completed"
          overline="Set location"
          headline={locationLabel}
        />
      ) : (
        <LocationStep at={at} />
      )}
      {!at('locationDone') ? null : at('networkDone') ? (
        <EditRow
          state="completed"
          overline="Select payment details"
          headline="Lightning"
        />
      ) : (
        <NetworkStep at={at} />
      )}
      {!at('networkDone') ? null : at('describeDone') ? (
        <>
          <EditRow
            state="completed"
            overline="Describe your offer"
            headline={offer.description}
          />
          <EditRow
            state="completed"
            overline="Choose offer language"
            headline="English"
          />
        </>
      ) : (
        <DescribeStep at={at} playhead={playhead} />
      )}
      {!at('describeDone') ? null : at('friendDone') ? (
        <>
          <EditRow
            state="completed"
            overline="Who can see your offer"
            headline="2nd degree"
            subheadline="You reach 1 280 people"
          />
          <Arrive>
            <Tap on={at('tapPublish')}>
              <Button variant="primary" size="large" onPress={noop}>
                Publish offer
              </Button>
            </Tap>
          </Arrive>
        </>
      ) : (
        <FriendLevelStep at={at} />
      )}
    </>
  )
}

/** "New offer": one step open at a time, finished steps collapsed into rows above it. */
export function OfferFormScene({
  at,
  playhead,
}: {
  at: At
  playhead: number
}): React.JSX.Element {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="New offer"
          rightActions={[{icon: XmarkCancelClose, onPress: noop}]}
        />
      }
    >
      {/* Scrolled to the newest step: content grows upwards once it overflows. */}
      <YStack flex={1} overflow="hidden" justifyContent="flex-end">
        <YStack minHeight="100%" flexShrink={0} gap="$5" pb="$5">
          <Steps at={at} playhead={playhead} />
        </YStack>
      </YStack>
      <ProgressDialog
        visible={at('publishing')}
        title={
          at('published') ? 'Done! Offer posted.' : 'Encrypting your offer ...'
        }
        belowProgressLeft={
          at('published')
            ? 'Anonymously delivered to 1 280 people'
            : 'for 1 280 people'
        }
        belowProgressRight={at('published') ? 'Done' : undefined}
        bottomText={
          at('published')
            ? 'Your friends and friends of their friends can now see your offer.'
            : 'Don’t close the app while encrypting. This can take a while.'
        }
        indicateProgress={
          at('published')
            ? {type: 'progress', percentage: 100}
            : {type: 'intermediate'}
        }
      />
    </Screen>
  )
}
