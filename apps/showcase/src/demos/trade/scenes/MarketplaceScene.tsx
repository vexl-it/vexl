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
import {useSharedValue} from 'react-native-reanimated'
import {AnonymousAvatar, Arrive} from '../../shared/chat'
import {noop} from '../../shared/noop'
import {Tap} from '../../shared/Tap'
import {offer} from '../script'

interface MarketplaceOffer {
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

export const tradeOffer: MarketplaceOffer = {
  id: 'trade',
  name: 'Friend of a friend',
  mine: false,
  selling: true,
  iconTag: 'bitcoin',
  commonFriends: 3,
  price: 'Up to 10 000 Kč',
  description: offer.description,
  details: ['Cash', offer.location],
  language: 'en',
}

const otherOffers: readonly MarketplaceOffer[] = [
  {
    id: 'brno',
    name: 'Friend of a friend',
    mine: false,
    selling: false,
    iconTag: 'bitcoin',
    commonFriends: 2,
    price: 'Up to 20 000 Kč',
    description: 'Buying for cash in Brno, weekends only.',
    details: ['Cash', 'Brno'],
    language: 'cs, en',
  },
  {
    id: 'prague7',
    name: 'Direct friend',
    mine: false,
    selling: true,
    iconTag: 'bitcoin',
    commonFriends: 5,
    price: '1 000 – 3 000 Kč',
    description: 'Small amounts over Lightning. Coffee near Letná?',
    details: ['Cash', 'Prague 7'],
    language: 'cs',
  },
]

const myOldOffer: MarketplaceOffer = {
  id: 'bike',
  name: 'Me',
  mine: true,
  selling: true,
  iconTag: 'product',
  price: '8 000 Kč',
  description: 'Road bike, 56 cm frame. Serviced this spring.',
  details: ['Pickup', 'Prague 2'],
  language: 'en, cs',
}

const myTradeOffer: MarketplaceOffer = {
  ...tradeOffer,
  id: 'mine',
  name: 'Me',
  mine: true,
  commonFriends: undefined,
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

/** The Marketplace tab: everyone's offers, or your own. */
export function MarketplaceScene({
  tab,
  newOffer,
  tapOffer,
  tapNewOffer,
}: {
  tab: 'all' | 'mine'
  newOffer: boolean
  tapOffer?: boolean
  tapNewOffer?: boolean
}): React.JSX.Element {
  const scrollY = useSharedValue(0)
  const theme = useTheme()
  const listed = tab === 'all' ? otherOffers : [myOldOffer]
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
          <MyOffersHeader count={newOffer ? 2 : 1} />
        )}
        <YStack gap="$5" px="$5">
          {newOffer ? (
            <Arrive>
              <Tap on={tapOffer ?? false}>
                <MarketplaceOfferCard
                  offer={tab === 'all' ? tradeOffer : myTradeOffer}
                />
              </Tap>
            </Arrive>
          ) : null}
          {pipe(
            listed,
            Array.map((card) => (
              <MarketplaceOfferCard key={card.id} offer={card} />
            ))
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
