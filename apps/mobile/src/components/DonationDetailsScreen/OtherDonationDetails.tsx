import {Button, Screen} from '@vexl-next/ui'
import {ScrollView, Stack, YStack} from '@vexl-next/ui/src/primitives'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import BtcInvoiceStatus from '../BtcInvoiceStatus'
import {showClaimConfirmationDialogActionAtom} from './atoms'
import {
  type DonationSummaryData,
  DonationSummaryCard,
} from './DonationDetailsSummary'

import {DonationDetailsNavigationBar} from './DonationDetailsNavigationBar'

export function OtherDonationDetails({
  footerHeight,
  summary,
  paymentMethod,
  paymentLink,
  status,
}: {
  readonly footerHeight: number
  readonly summary: DonationSummaryData
  readonly paymentMethod: React.ComponentProps<
    typeof BtcInvoiceStatus
  >['donationPaymentMethod']
  readonly paymentLink: React.ComponentProps<
    typeof BtcInvoiceStatus
  >['paymentLink']
  readonly status: React.ComponentProps<typeof BtcInvoiceStatus>['status']
}): React.ReactElement {
  const {t} = useTranslation()
  const tokens = getTokens()
  const showClaimConfirmationDialog = useSetAtom(
    showClaimConfirmationDialogActionAtom
  )
  const showClaimConfirmationButton =
    status !== 'New' &&
    status !== 'Expired' &&
    status !== 'Invalid' &&
    status !== 'Processing'

  return (
    <Screen
      navigationBar={
        <DonationDetailsNavigationBar title={t('donations.donationDetails')} />
      }
      footer={
        showClaimConfirmationButton ? (
          <Button
            width="100%"
            variant="secondary"
            onPress={() => {
              Effect.runFork(showClaimConfirmationDialog())
            }}
          >
            {t('donations.claimConfirmation')}
          </Button>
        ) : undefined
      }
    >
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: footerHeight + tokens.space.$5.val,
        }}
      >
        <YStack gap="$5">
          <DonationSummaryCard summary={summary} />
          <Stack alignSelf="center">
            <BtcInvoiceStatus
              donationPaymentMethod={paymentMethod}
              paymentLink={paymentLink}
              status={status}
            />
          </Stack>
        </YStack>
      </ScrollView>
    </Screen>
  )
}
