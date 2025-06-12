import {FlashList} from '@shopify/flash-list'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {RefreshControl} from 'react-native-gesture-handler'
import {getTokens, Stack} from 'tamagui'
import {
  fetchMyDonationsActionAtom,
  myDonationsSortedAtom,
  myDonationsStateAtom,
} from '../../../state/donations/atom'
import {type MyDonation} from '../../../state/donations/domain'
import DonationsListItem from './DonationsListItem'
import EmptyListPlaceholder from './EmptyListPlaceholder'

function Separator(): JSX.Element {
  return (
    <Stack width="100%" height={32} jc="center" als="center">
      <Stack height={2} bg="$grey" />
    </Stack>
  )
}

function renderItem({item}: {item: MyDonation}): JSX.Element {
  return <DonationsListItem donation={item} />
}

function DonationsList(): JSX.Element {
  const myDonationsSorted = useAtomValue(myDonationsSortedAtom)
  const myDonationsLoading = useAtomValue(myDonationsStateAtom) === 'loading'
  const fetchMyDonations = useSetAtom(fetchMyDonationsActionAtom)

  if (myDonationsSorted.length === 0) {
    return <EmptyListPlaceholder />
  }

  return (
    <FlashList
      estimatedItemSize={78}
      data={myDonationsSorted}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
      keyExtractor={(donation) => donation.invoiceId}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={myDonationsLoading ?? false}
          onRefresh={() => Effect.runFork(fetchMyDonations())}
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
    />
  )
}

export default DonationsList
