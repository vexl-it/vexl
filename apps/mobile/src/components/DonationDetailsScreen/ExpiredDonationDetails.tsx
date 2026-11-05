import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Backdrop,
  Button,
  getTokens,
  QrCodeFrame,
  Rejected,
  Screen,
  Typography,
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

const EXPIRED_QR_CODE_SIZE = 275
const EXPIRED_QR_STATUS_PANEL_SIZE = 200

export function ExpiredDonationDetails({
  title,
  donation,
  paymentLink,
  isLightning,
  summary,
  expiredAt,
}: {
  readonly title: string
  readonly donation: MyDonation | undefined
  readonly paymentLink: string
  readonly isLightning: boolean
  readonly summary: DonationSummaryData
  readonly expiredAt: string
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<DonationsFlowScreenProps<'DonationDetails'>['navigation']>()
  const theme = useTheme()
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
        <DonationDetailTitleRow title={title} status="Expired" />
        <DonationSummaryCard
          summary={summary}
          finalTimestampLabel={t('donationPrompt.expiredAt')}
          finalTimestampValue={expiredAt}
          onCopyInvoiceId={() => {
            Clipboard.setString(summary.invoiceId)
            setToastNotification(t('donations.copiedToClipboard'))
          }}
        />
        <YStack
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          padding="$8"
          alignItems="center"
        >
          <QrCodeFrame
            size={EXPIRED_QR_CODE_SIZE}
            value={paymentLink}
            logo={
              isLightning
                ? require('../images/lightningLogo.png')
                : require('../images/btcLogo.png')
            }
            ecl="H"
            overlay={
              <>
                <Backdrop variant="surface" borderRadius="$3" />
                <YStack
                  position="absolute"
                  width={EXPIRED_QR_STATUS_PANEL_SIZE}
                  height={EXPIRED_QR_STATUS_PANEL_SIZE}
                  borderRadius="$8"
                  backgroundColor="$backgroundSecondary"
                  alignItems="center"
                  justifyContent="center"
                  gap="$5"
                >
                  <Rejected
                    size={getTokens().size.$12.val}
                    color={theme.accentHighlightPrimary.get()}
                  />
                  <Typography
                    variant="heading3"
                    color="$accentHighlightPrimary"
                  >
                    {t('donations.invoiceStatus.Expired')}
                  </Typography>
                </YStack>
              </>
            }
          />
        </YStack>
      </YStack>
    </Screen>
  )
}
