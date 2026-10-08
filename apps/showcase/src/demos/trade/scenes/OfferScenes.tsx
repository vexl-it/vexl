import {
  ArchiveInbox,
  Button,
  ChevronLeft,
  CommonFriends,
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
import {AnonymousAvatar} from '../../shared/chat'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {Tap} from '../../shared/Tap'
import {offer, typing} from '../script'
import {tradeOffer} from './MarketplaceScene'

function AuthorBanner(): React.JSX.Element {
  return (
    <OfferAuthorBanner
      avatar={<AnonymousAvatar side="you" size={offerAuthorBannerAvatarSize} />}
      name={tradeOffer.name}
      textTagVariant="offer"
      textTagLabel="Has"
      iconTagVariant="bitcoin"
      commonFriendsLabel="3 common"
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

export function OfferDetailScene({
  tapSendMessage,
}: {
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
        <AuthorBanner />
        <Typography
          variant="description"
          color="$foregroundPrimary"
          lineHeight={20}
        >
          {offer.description}
        </Typography>
        <OfferPropertiesCard
          rows={[
            {label: 'Amount', value: tradeOffer.price},
            {label: 'Location', value: [offer.location]},
            {label: 'Payment method', value: 'Cash • Lightning'},
            {label: 'Preferred languages', value: tradeOffer.language},
          ]}
        />
        <CommonFriends
          label="3 common"
          friends={[
            {id: 'petra', name: 'Petra'},
            {id: 'tomas', name: 'Tomáš'},
            {id: 'jana', name: 'Jana'},
          ]}
        />
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
  playhead,
  tapSend,
}: {
  playhead: number
  tapSend: boolean
}): React.JSX.Element {
  const message = typedAt(typing.request, playhead)
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
        <AuthorBanner />
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
