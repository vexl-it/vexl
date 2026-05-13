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
import {ScrollView, Stack, YStack} from '@vexl-next/ui/src/primitives'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {type MyDonation} from '../../state/donations/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {SharableQrCode} from '../SharableQrCode'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {retryDonationActionAtom} from './atoms'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'

const EXPIRED_QR_CODE_SIZE = 279
const EXPIRED_QR_STATUS_PANEL_SIZE = 200
const EXPIRED_QR_CODE_BORDER_WIDTH = 2
const EXPIRED_QR_CODE_CONTENT_SIZE =
  EXPIRED_QR_CODE_SIZE - EXPIRED_QR_CODE_BORDER_WIDTH * 2

export function ExpiredDonationDetails({
  footerHeight,
  title,
  donation,
  paymentLink,
  isLightning,
  summary,
  expiredAt,
}: {
  readonly footerHeight: number
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
            <Stack
              width={EXPIRED_QR_CODE_SIZE}
              height={EXPIRED_QR_CODE_SIZE}
              alignSelf="center"
              overflow="hidden"
              borderRadius="$3"
              backgroundColor="$white100"
              padding={EXPIRED_QR_CODE_BORDER_WIDTH}
              alignItems="center"
              justifyContent="center"
            >
              <SharableQrCode
                size={EXPIRED_QR_CODE_CONTENT_SIZE}
                value={paymentLink}
                logo={
                  isLightning
                    ? require('../images/lightningLogo.png')
                    : require('../images/btcLogo.png')
                }
                logoSize={tokens.size.$11.val}
                logoBackgroundColor={theme.gradientHelper.get()}
                ecl="H"
              />
              <Stack
                position="absolute"
                top="$0"
                left="$0"
                right="$0"
                bottom="$0"
                backgroundColor="$backgroundPrimary"
                borderRadius="$3"
                opacity={0.72}
              />
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
                  size={64}
                  color={theme.accentHighlightPrimary.get()}
                />
                <Typography variant="heading3" color="$accentHighlightPrimary">
                  {t('donations.invoiceStatus.Expired')}
                </Typography>
              </YStack>
            </Stack>
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  )
}
