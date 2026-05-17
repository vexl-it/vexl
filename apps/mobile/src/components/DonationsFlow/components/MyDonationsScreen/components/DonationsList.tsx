import {FlashList} from '@shopify/flash-list'
import {Banner, Stack, Typography, YStack, useTheme} from '@vexl-next/ui'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {RefreshControl} from 'react-native-gesture-handler'
import {
  myDonationsSortedAtom,
  myDonationsStateAtom,
} from '../../../../../state/donations/atom'
import {type MyDonation} from '../../../../../state/donations/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom} from '../../../../DonationPrompt/atoms'
import DonationsListItem from './DonationsListItem'
import EmptyListPlaceholder from './EmptyListPlaceholder'

function Separator(): React.ReactElement {
  return <Stack height="$5" />
}

function renderItem({item}: {item: MyDonation}): React.ReactElement {
  return <DonationsListItem donation={item} />
}

interface Props {
  readonly onDonatePress: () => void
}

function DonationsList({onDonatePress}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const myDonationsSorted = useAtomValue(myDonationsSortedAtom)
  const myDonationsLoading = useAtomValue(myDonationsStateAtom) === 'loading'
  const updateAllNonSettledOrExpiredInvoicesStatusTypes = useSetAtom(
    updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom
  )

  if (!Array.isNonEmptyArray(myDonationsSorted)) {
    return <EmptyListPlaceholder onDonatePress={onDonatePress} />
  }

  return (
    <FlashList
      data={myDonationsSorted}
      ListHeaderComponent={
        <YStack gap="$5" marginBottom="$5">
          <Banner
            color="pink"
            title={t('donationPrompt.giveLove')}
            description={t('donations.emptyState.description')}
            primaryButton={{
              label: t('donationPrompt.donate'),
              onPress: onDonatePress,
            }}
          />
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {t('donations.recentDonations')}
          </Typography>
        </YStack>
      }
      ItemSeparatorComponent={Separator}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      keyExtractor={(donation) => donation.invoiceId}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={myDonationsLoading ?? false}
          onRefresh={() =>
            Effect.runFork(updateAllNonSettledOrExpiredInvoicesStatusTypes())
          }
          tintColor={theme.foregroundTertiary.get()}
        />
      }
    />
  )
}

export default DonationsList
