import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Button,
  EmptyState,
  getTokens,
  Rejected,
  Screen,
  useTheme,
  YStack,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {type MyDonation} from '../../state/donations/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {retryDonationActionAtom} from './atoms'
import {DonationDetailsNavigationBar} from './DonationDetailsNavigationBar'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'

export function InvalidDonationDetails({
  title,
  donation,
  summary,
  expiredAt,
}: {
  readonly title: string
  readonly donation: MyDonation | undefined
  readonly summary: DonationSummaryData
  readonly expiredAt: string
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<DonationsFlowScreenProps<'DonationDetails'>['navigation']>()
  const theme = useTheme()
  const tokens = getTokens()
  const retryDonation = useSetAtom(retryDonationActionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const handleRetryDonationPress = (): void => {
    if (!donation) return

    void Effect.runPromise(retryDonation(donation)).then((newInvoiceId) => {
      if (newInvoiceId) {
        navigation.replace('DonationDetails', {invoiceId: newInvoiceId})
      }
    })
  }

  return (
    <Screen
      scrollable
      navigationBar={
        <DonationDetailsNavigationBar title={t('donations.detail.title')} />
      }
      footer={
        <Button size="large" width="100%" onPress={handleRetryDonationPress}>
          {t('common.tryAgain')}
        </Button>
      }
    >
      <YStack gap="$5">
        <DonationDetailTitleRow title={title} status="Invalid" />
        <EmptyState
          framed
          graphic={
            <Rejected
              size={tokens.size.$12.val}
              color={theme.redForeground.get()}
            />
          }
          title={t('donations.detail.paymentFailedTitle')}
          description={`${t('donations.detail.paymentFailedDescriptionFirstLine')}\n${t('donations.detail.paymentFailedDescriptionSecondLine')}`}
        />
        <DonationSummaryCard
          summary={summary}
          finalTimestampLabel={t('donationPrompt.expiredAt')}
          finalTimestampValue={expiredAt}
          onCopyInvoiceId={() => {
            Clipboard.setString(summary.invoiceId)
            setToastNotification(t('donations.copiedToClipboard'))
          }}
        />
      </YStack>
    </Screen>
  )
}
