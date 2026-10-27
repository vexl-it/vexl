import {
  Button,
  ChatBubbles,
  ChevronLeft,
  Dialog,
  DialogDescription,
  DialogTitle,
  EditRow,
  ListWriteDocument,
  MegaphoneNotifications,
  MenuItem,
  MoneyBankNotes,
  NavigationBar,
  OfferHandCash,
  Pause,
  PeopleUsers,
  PinGeolocation,
  Screen,
  Switch,
  TextTag,
  TrashBin,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Arrive} from '../shared/chat'
import {noop} from '../shared/noop'
import {Tap} from '../shared/Tap'
import {useValueAtom} from '../shared/useValueAtom'
import {nearbyOffer} from './script'

export interface MyOfferDetailState {
  readonly tapSwitch: boolean
  readonly confirming: boolean
  readonly tapConfirm: boolean
  readonly sharing: boolean
}

function ConfirmDialog({
  visible,
  tapConfirm,
}: {
  visible: boolean
  tapConfirm: boolean
}): React.JSX.Element {
  return (
    <Dialog
      visible={visible}
      footer={
        <>
          <Button variant="secondary" size="large" flex={1} onPress={noop}>
            Cancel
          </Button>
          <Tap on={tapConfirm} flex={1}>
            <Button variant="primary" size="large" onPress={noop}>
              Yes, share
            </Button>
          </Tap>
        </>
      }
    >
      <DialogTitle>Share this offer nearby?</DialogTitle>
      <DialogDescription>
        Anyone near you will be able to read the full offer, including people
        outside your network and people who don’t use Vexl. While sharing is on,
        your phone can be discovered over Bluetooth. You can turn it off any
        time.
      </DialogDescription>
    </Dialog>
  )
}

/** Your own offer's detail, where you turn on sharing with people nearby. */
export function MyOfferDetailScene({
  state: {tapSwitch, confirming, tapConfirm, sharing},
}: {
  state: MyOfferDetailState
}): React.JSX.Element {
  const sharingAtom = useValueAtom(sharing)
  const confirmVisible = confirming && !sharing
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Offer details"
          leftAction={{icon: ChevronLeft, onPress: noop}}
          rightActions={[
            {icon: Pause, onPress: noop},
            {icon: TrashBin, variant: 'destructive', onPress: noop},
          ]}
        />
      }
    >
      <YStack gap="$5">
        <XStack alignItems="center" gap="$5" paddingVertical="$4">
          <Typography
            variant="paragraphDemibold"
            color="$foregroundPrimary"
            flex={1}
          >
            I’m offering bitcoin
          </Typography>
          <YStack gap="$2" alignItems="flex-end">
            <TextTag variant="approved" label="Active offer" />
            {sharing ? (
              <Arrive>
                <TextTag variant="neutral" label="Sharing nearby" />
              </Arrive>
            ) : null}
          </YStack>
        </XStack>
        <EditRow
          state="completed"
          icon={MoneyBankNotes}
          overline="Amount"
          headline="0 – 5 000 CZK"
        />
        <EditRow
          state="completed"
          icon={PinGeolocation}
          overline="Location"
          headline={`${nearbyOffer.location}, radius of 1 km`}
        />
        <EditRow
          state="completed"
          icon={OfferHandCash}
          overline="Payment details"
          headline={nearbyOffer.paymentMethod}
        />
        <EditRow
          state="completed"
          icon={ListWriteDocument}
          overline="Offer description"
          headline={nearbyOffer.description}
        />
        <EditRow
          state="completed"
          icon={ChatBubbles}
          overline="Offer language"
          headline="English"
        />
        <EditRow
          state="completed"
          icon={PeopleUsers}
          overline="Who can see your offer"
          headline="2nd degree"
          subheadline="You reach 1 280 people"
        />
        <MenuItem
          label="Share with people nearby"
          note="Over Bluetooth, with anyone close to you"
          icon={MegaphoneNotifications}
          showChevron={false}
          tag={
            <Tap on={tapSwitch}>
              <Switch valueAtom={sharingAtom} />
            </Tap>
          }
        />
      </YStack>
      <ConfirmDialog visible={confirmVisible} tapConfirm={tapConfirm} />
    </Screen>
  )
}
