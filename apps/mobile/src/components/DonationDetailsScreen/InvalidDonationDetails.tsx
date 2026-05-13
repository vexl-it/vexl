import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Button,
  NavigationBar,
  Rejected,
  Screen,
  Typography,
  useTheme,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {ScrollView, YStack} from '@vexl-next/ui/src/primitives'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {type MyDonation} from '../../state/donations/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {retryDonationActionAtom} from './atoms'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'

export function InvalidDonationDetails({
  footerHeight,
  title,
  donation,
  summary,
  expiredAt,
}: {
  readonly footerHeight: number
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
      navigationBar={
        <NavigationBar
          style="back"
          title={t('donations.detail.title')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: navigation.goBack,
            },
          ]}
        />
      }
      footer={
        <Button size="large" width="100%" onPress={handleRetryDonationPress}>
          {t('common.tryAgain')}
        </Button>
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
          <DonationDetailTitleRow title={title} status="Invalid" />
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            padding="$5"
            gap="$5"
            alignItems="center"
            justifyContent="center"
          >
            <Rejected size={64} color={theme.redForeground.get()} />
            <Typography
              variant="heading2"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {t('donations.detail.paymentFailedTitle')}
            </Typography>
            <YStack alignItems="center">
              <Typography
                variant="paragraphSmall"
                color="$foregroundSecondary"
                textAlign="center"
              >
                {t('donations.detail.paymentFailedDescriptionFirstLine')}
              </Typography>
              <Typography
                variant="paragraphSmall"
                color="$foregroundSecondary"
                textAlign="center"
              >
                {t('donations.detail.paymentFailedDescriptionSecondLine')}
              </Typography>
            </YStack>
          </YStack>
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
      </ScrollView>
    </Screen>
  )
}
