import {
  ArchiveInbox,
  Button,
  ChevronLeft,
  FlagReport,
  InfoCircle,
  Menu,
  MenuItem,
  NavigationBar,
  OfferAuthorBanner,
  offerAuthorBannerAvatarSize,
  OfferPropertiesCard,
  Screen,
  StarOutline,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import type {ReactNode} from 'react'
import {AnonymousAvatar} from './chat'
import type {MarketplaceOffer} from './MarketplaceScene'
import {noop} from './noop'
import {Tap} from './Tap'

/** An offer someone else posted, as its detail screen shows it. Its author is always `you`. */
export interface DetailedOffer extends MarketplaceOffer {
  readonly location: string
  readonly paymentMethod: string
}

function AuthorBanner({offer}: {offer: DetailedOffer}): React.JSX.Element {
  return (
    <OfferAuthorBanner
      avatar={<AnonymousAvatar side="you" size={offerAuthorBannerAvatarSize} />}
      name={offer.name}
      textTagVariant={offer.selling ? 'offer' : 'request'}
      textTagLabel={offer.selling ? 'Has' : 'Wants'}
      iconTagVariant={offer.iconTag}
      commonFriendsLabel={
        offer.commonFriends === undefined
          ? undefined
          : `${offer.commonFriends} common`
      }
    />
  )
}

function FirstInteractionNote(): React.JSX.Element {
  const theme = useTheme()
  return (
    <XStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$3"
      padding="$4"
      gap="$2"
      alignItems="center"
    >
      <InfoCircle size={18} color={theme.foregroundSecondary.get()} />
      <Typography variant="description" color="$foregroundSecondary" flex={1}>
        This will be your first interaction with this offer.
      </Typography>
    </XStack>
  )
}

/** `connection` says how the offer reached you, e.g. your common friends. */
export function OfferDetailScene({
  offer,
  connection,
  tapSendMessage,
}: {
  offer: DetailedOffer
  connection: ReactNode
  tapSendMessage: boolean
}): React.JSX.Element {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Offer detail"
          leftAction={{icon: StarOutline, onPress: noop}}
          rightActions={[{icon: XmarkCancelClose, onPress: noop}]}
        />
      }
      footer={
        <YStack gap="$2">
          <FirstInteractionNote />
          <Tap on={tapSendMessage}>
            <Button variant="primary" onPress={noop}>
              Send a message
            </Button>
          </Tap>
        </YStack>
      }
    >
      <YStack gap="$4">
        <AuthorBanner offer={offer} />
        <Typography
          variant="description"
          color="$foregroundPrimary"
          lineHeight={20}
        >
          {offer.description}
        </Typography>
        <OfferPropertiesCard
          rows={[
            {label: 'Amount', value: offer.price},
            {label: 'Location', value: [offer.location]},
            {label: 'Payment method', value: offer.paymentMethod},
            {label: 'Preferred languages', value: offer.language},
          ]}
        />
        {connection}
        <Menu>
          <MenuItem
            label="Archive offer"
            icon={ArchiveInbox}
            showChevron={false}
          />
          <MenuItem
            label="Report offer"
            icon={FlagReport}
            variant="danger"
            showChevron={false}
          />
        </Menu>
      </YStack>
    </Screen>
  )
}

export function SendMessageScene({
  offer,
  message,
  tapSend,
}: {
  offer: DetailedOffer
  message: string
  tapSend: boolean
}): React.JSX.Element {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Send a message"
          leftAction={{icon: ChevronLeft, onPress: noop}}
          rightActions={[{icon: XmarkCancelClose, onPress: noop}]}
        />
      }
      footer={
        <Tap on={tapSend}>
          <Button variant={message ? 'primary' : 'disabled'} onPress={noop}>
            Send
          </Button>
        </Tap>
      }
    >
      <YStack gap="$5">
        <AuthorBanner offer={offer} />
        <YStack
          height={250}
          backgroundColor="$backgroundTertiary"
          borderRadius="$5"
          padding="$6"
        >
          <Typography
            variant="paragraph"
            color={message ? '$foregroundPrimary' : '$foregroundSecondary'}
          >
            {message || "e.g. Hey, I'm interested in your offer..."}
          </Typography>
        </YStack>
      </YStack>
    </Screen>
  )
}
