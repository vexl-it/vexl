import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  DonationThanksHeartGraphic,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {ScrollView, YStack} from '@vexl-next/ui/src/primitives'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'

export function SettledDonationDetails({
  footerHeight,
  title,
  summary,
  paidAt,
}: {
  readonly footerHeight: number
  readonly title: string
  readonly summary: DonationSummaryData
  readonly paidAt: string
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<DonationsFlowScreenProps<'DonationDetails'>['navigation']>()
  const tokens = getTokens()
  const setToastNotification = useSetAtom(toastNotificationAtom)

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
    >
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: footerHeight + tokens.space.$5.val,
        }}
      >
        <YStack gap="$5">
          <DonationDetailTitleRow title={title} status="Settled" />
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            padding="$5"
            gap="$5"
            alignItems="center"
            justifyContent="center"
          >
            <DonationThanksHeartGraphic />
            <Typography
              variant="heading2"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {t('donations.detail.thanksTitle')}
            </Typography>
            <Typography
              variant="paragraphSmall"
              color="$foregroundSecondary"
              textAlign="center"
            >
              {t('donations.detail.thanksDescription')}
            </Typography>
          </YStack>
          <DonationSummaryCard
            summary={summary}
            finalTimestampLabel={t('donations.detail.paidAt')}
            finalTimestampValue={paidAt}
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
