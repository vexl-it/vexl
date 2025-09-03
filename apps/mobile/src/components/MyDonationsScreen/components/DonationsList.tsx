import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {FlatList, RefreshControl} from 'react-native-gesture-handler'
import {getTokens, Stack} from 'tamagui'
import {
  myDonationsSortedAtom,
  myDonationsStateAtom,
} from '../../../state/donations/atom'
import {type MyDonation} from '../../../state/donations/domain'
import {updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom} from '../../DonationPrompt/atoms'
import DonationsListItem from './DonationsListItem'
import EmptyListPlaceholder from './EmptyListPlaceholder'

function Separator(): React.ReactElement {
  return (
    <Stack width="100%" height={32} jc="center" als="center">
      <Stack height={2} bg="$grey" />
    </Stack>
  )
}

function renderItem({item}: {item: MyDonation}): React.ReactElement {
  return <DonationsListItem donation={item} />
}

function DonationsList(): React.ReactElement {
  const myDonationsSorted = useAtomValue(myDonationsSortedAtom)
  const myDonationsLoading = useAtomValue(myDonationsStateAtom) === 'loading'
  const updateAllNonSettledOrExpiredInvoicesStatusTypes = useSetAtom(
    updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom
  )

  if (myDonationsSorted.length === 0) {
    return <EmptyListPlaceholder />
  }

  // TODO: Replace with FlashList once stable v2 is released
  // v1 contains bug: https://github.com/Shopify/flash-list/issues/633
  return (
    <FlatList
      data={myDonationsSorted}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
      keyExtractor={(donation) => donation.invoiceId}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={myDonationsLoading ?? false}
          onRefresh={() =>
            Effect.runFork(updateAllNonSettledOrExpiredInvoicesStatusTypes())
          }
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
    />
  )
}

export default DonationsList
