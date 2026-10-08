import {
  AnimatedNavigationBar,
  ArrowsHorizontal,
  ArrowsVerticalSort,
  BellNotification,
  ChatBubbles,
  FabButton,
  FilterBar,
  IconButton,
  IconTag,
  Map as MapIcon,
  MathCalculate,
  OfferCard,
  PeopleUsers,
  PlusAdd,
  SearchBar,
  Stack,
  TabBar,
  Tabs,
  TextTag,
  TuneSettings,
  Typography,
  UserProfile,
  useTheme,
  XStack,
  YStack,
  type IconProps,
  type IconTagVariant,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {Fragment} from 'react'
import {useSharedValue} from 'react-native-reanimated'
import {AnonymousAvatar, Arrive} from './chat'
import {noop} from './noop'
import {Tap} from './Tap'

export interface MarketplaceOffer {
  readonly id: string
  readonly name: string
  readonly mine: boolean
  readonly selling: boolean
  readonly iconTag: IconTagVariant
  readonly commonFriends?: number
  readonly price: string
  readonly description: string
  readonly details: readonly string[]
  readonly language: string
}

const tabBarItems: ReadonlyArray<{
  label: string
  value: string
  icon: React.ComponentType<IconProps>
}> = [
  {label: 'Marketplace', value: 'marketplace', icon: ArrowsHorizontal},
  {label: 'Chats', value: 'chats', icon: ChatBubbles},
  {label: 'Community', value: 'community', icon: PeopleUsers},
]

const filters = [
  'Buy BTC',
  'Sell BTC',
  'Buy product',
  'Sell product',
  'Provide service',
  'Hire service',
]

function MarketplaceOfferCard({
  offer: card,
}: {
  offer: MarketplaceOffer
}): React.JSX.Element {
  const tagLabel = card.mine
    ? card.selling
      ? 'I have'
      : 'I want'
    : card.selling
      ? 'Has'
      : 'Wants'
  return (
    <OfferCard
      avatar={card.mine ? undefined : <AnonymousAvatar side="you" size={40} />}
      name={card.name}
      textTag={
        <TextTag
          label={tagLabel}
          variant={card.selling ? 'offer' : 'request'}
        />
      }
      iconTag={<IconTag variant={card.iconTag} />}
      commonFriends={
        card.commonFriends === undefined
          ? undefined
          : `${card.commonFriends} common friends`
      }
      price={card.price}
      description={card.description}
      details={[...card.details, {text: card.language, icon: ChatBubbles}]}
    />
  )
}

function InlineButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<IconProps>
  label: string
}): React.JSX.Element {
  const theme = useTheme()
  return (
    <XStack gap="$2" alignItems="center">
      <Icon size={18} color={theme.accentHighlightPrimary.get()} />
      <Typography variant="description" color="$accentHighlightPrimary">
        {label}
      </Typography>
    </XStack>
  )
}

function AllOffersHeader(): React.JSX.Element {
  const theme = useTheme()
  return (
    <YStack pt="$7" pb="$5">
      <YStack gap="$4" pb="$7">
        <FilterBar
          items={pipe(
            filters,
            Array.map((label) => ({label, value: label}))
          )}
          selectedValues={new Set<string>()}
          onSelectedValuesChange={noop}
          containerStyle={{marginLeft: '$5'}}
        />
        <XStack gap="$3" px="$5">
          <SearchBar
            flex={1}
            variant="dummy"
            placeholder="Search"
            onPress={noop}
          />
          <IconButton>
            <TuneSettings size={24} color={theme.foregroundPrimary.get()} />
          </IconButton>
        </XStack>
      </YStack>
      <XStack px="$5" justifyContent="space-between" alignItems="center">
        <Typography variant="description" color="$foregroundSecondary">
          24 offers
        </Typography>
        <InlineButton icon={MapIcon} label="Show on map" />
      </XStack>
    </YStack>
  )
}

function MyOffersHeader({count}: {count: number}): React.JSX.Element {
  return (
    <XStack
      pt="$7"
      pb="$5"
      px="$7"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography variant="description" color="$foregroundSecondary">
        {`${count} offers`}
      </Typography>
      <InlineButton icon={ArrowsVerticalSort} label="Sort by oldest" />
    </XStack>
  )
}

/** The Marketplace tab: everyone's offers, or your own, listed top to bottom. */
export function MarketplaceScene({
  tab,
  offers,
  arrivingOfferId,
  tappedOfferId,
  tapNewOffer,
}: {
  tab: 'all' | 'mine'
  offers: readonly MarketplaceOffer[]
  arrivingOfferId?: string
  tappedOfferId?: string
  tapNewOffer?: boolean
}): React.JSX.Element {
  const scrollY = useSharedValue(0)
  const theme = useTheme()
  return (
    <Stack flex={1} backgroundColor="$backgroundPrimary">
      <AnimatedNavigationBar
        title={tab === 'all' ? 'All offers' : 'My offers'}
        rightActions={[
          {icon: BellNotification, onPress: noop},
          {icon: MathCalculate, onPress: noop},
          {icon: UserProfile, onPress: noop},
        ]}
        scrollY={scrollY}
      />
      <YStack flex={1} overflow="hidden">
        <Stack paddingLeft="$5">
          <Tabs
            tabs={[
              {label: 'All offers', value: 'all'},
              {label: 'My offers', value: 'mine'},
            ]}
            activeTab={tab}
            onTabPress={noop}
          />
        </Stack>
        {tab === 'all' ? (
          <AllOffersHeader />
        ) : (
          <MyOffersHeader count={offers.length} />
        )}
        <YStack gap="$5" px="$5">
          {pipe(
            offers,
            Array.map((card) => {
              const listed = (
                <Tap on={card.id === tappedOfferId}>
                  <MarketplaceOfferCard offer={card} />
                </Tap>
              )
              return card.id === arrivingOfferId ? (
                <Arrive key={card.id}>{listed}</Arrive>
              ) : (
                <Fragment key={card.id}>{listed}</Fragment>
              )
            })
          )}
        </YStack>
      </YStack>
      <Stack position="absolute" bottom={84 + 16} right="$4" zIndex={2}>
        <Tap on={tapNewOffer ?? false}>
          <FabButton
            icon={<PlusAdd size={24} color={theme.black100.get()} />}
            label="New offer"
          />
        </Tap>
      </Stack>
      <TabBar
        tabs={tabBarItems}
        activeTab="marketplace"
        onTabPress={noop}
        bottomInset={34}
      />
    </Stack>
  )
}
