import {FlashList} from '@shopify/flash-list'
import {
  FabButton,
  Gift,
  Stack,
  Tabs,
  Typography,
  YStack,
  useTheme,
  type TabItem,
} from '@vexl-next/ui'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, useState} from 'react'
import {RefreshControl} from 'react-native-gesture-handler'
import {getTokens} from 'tamagui'
import {myDonationsSortedAtom} from '../../../../../state/donations/atom'
import {type MyDonation} from '../../../../../state/donations/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  myDonationsRefreshingAtom,
  refreshMyDonationsActionAtom,
} from '../../../../DonationPrompt/atoms'
import {
  filterDonationsByStatus,
  type DonationStatusFilter,
} from '../donationStatusFilter'
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
  const tokens = getTokens()
  const myDonationsSorted = useAtomValue(myDonationsSortedAtom)
  const myDonationsRefreshing = useAtomValue(myDonationsRefreshingAtom)
  const refreshMyDonations = useSetAtom(refreshMyDonationsActionAtom)
  const [selectedStatus, setSelectedStatus] =
    useState<DonationStatusFilter>('all')
  const [donateButtonHeight, setDonateButtonHeight] = useState(0)
  const statusTabs = useMemo(
    (): ReadonlyArray<TabItem<DonationStatusFilter>> => [
      {label: t('donations.filters.all'), value: 'all'},
      {label: t('donations.filters.inProgress'), value: 'inProgress'},
      {label: t('donations.filters.paid'), value: 'paid'},
      {label: t('donations.filters.unsuccessful'), value: 'unsuccessful'},
    ],
    [t]
  )
  const filteredDonations = filterDonationsByStatus(
    myDonationsSorted,
    selectedStatus
  )

  if (!Array.isNonEmptyArray(myDonationsSorted)) {
    return (
      <Stack flex={1} px="$5">
        <EmptyListPlaceholder onDonatePress={onDonatePress} />
      </Stack>
    )
  }

  return (
    <YStack flex={1}>
      <Stack pl="$5" mb="$4">
        <Tabs
          tabs={statusTabs}
          activeTab={selectedStatus}
          onTabPress={setSelectedStatus}
          size="small"
        />
      </Stack>
      <FlashList
        key={selectedStatus}
        data={filteredDonations}
        contentContainerStyle={{
          paddingHorizontal: tokens.space.$5.val,
          paddingBottom: donateButtonHeight + 2 * tokens.space.$4.val,
        }}
        ListHeaderComponent={
          <Typography
            variant="paragraphSmallBold"
            color="$foregroundPrimary"
            mb="$5"
          >
            {t('donations.recentDonations')}
          </Typography>
        }
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyListPlaceholder
            variant="noMatchingDonations"
            onDonatePress={onDonatePress}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(donation) => donation.invoiceId}
        indicatorStyle="white"
        refreshControl={
          <RefreshControl
            refreshing={myDonationsRefreshing}
            onRefresh={() => Effect.runFork(refreshMyDonations())}
            tintColor={theme.foregroundTertiary.get()}
          />
        }
      />
      <Stack
        position="absolute"
        bottom="$4"
        right="$4"
        zIndex={2}
        onLayout={(event) => {
          setDonateButtonHeight(event.nativeEvent.layout.height)
        }}
      >
        <FabButton
          icon={<Gift size={24} color={theme.black100.get()} />}
          label={t('donationPrompt.donate')}
          onPress={onDonatePress}
        />
      </Stack>
    </YStack>
  )
}

export default DonationsList
