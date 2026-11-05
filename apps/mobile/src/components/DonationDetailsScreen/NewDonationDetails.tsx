import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Button,
  Copy,
  DetailsCard,
  Download,
  QrCodeFrame,
  Screen,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useQrCodeSharing} from '../SharableQrCode'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'

import {DonationDetailsNavigationBar} from './DonationDetailsNavigationBar'

const QR_CODE_SIZE = 300

export function NewDonationDetails({
  paymentLink,
  isLightning,
  summary,
}: {
  readonly paymentLink: string
  readonly isLightning: boolean
  readonly summary: DonationSummaryData
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<DonationsFlowScreenProps<'DonationDetails'>['navigation']>()
  const {getRef: getQrCodeRef, share: shareQrCode} = useQrCodeSharing()
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const paymentLabel = isLightning
    ? t('offerForm.network.lightning')
    : t('offerForm.network.onChainRedesign')

  return (
    <Screen
      scrollable
      navigationBar={
        <DonationDetailsNavigationBar title={t('donations.completePayment')} />
      }
      footer={
        <Button width="100%" onPress={navigation.goBack}>
          {t('common.close')}
        </Button>
      }
    >
      <YStack gap="$5">
        <DonationSummaryCard summary={summary} />

        <DetailsCard>
          <QrCodeFrame
            size={QR_CODE_SIZE}
            value={paymentLink}
            logo={
              isLightning
                ? require('../images/lightningLogo.png')
                : require('../images/btcLogo.png')
            }
            ecl="H"
            getRef={getQrCodeRef}
            onPress={shareQrCode}
          />
          <Button
            size="small"
            variant="secondary"
            width="100%"
            icon={Download}
            onPress={shareQrCode}
          >
            {t('donations.downloadImage')}
          </Button>
        </DetailsCard>

        <DetailsCard>
          <YStack gap="$2">
            <Typography variant="micro" color="$foregroundSecondary">
              {paymentLabel}
            </Typography>
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {paymentLink}
            </Typography>
          </YStack>
          <Button
            size="small"
            variant="secondary"
            width="100%"
            icon={Copy}
            onPress={() => {
              Clipboard.setString(paymentLink)
              setToastNotification(t('donations.copiedToClipboard'))
            }}
          >
            {t('common.copy')}
          </Button>
        </DetailsCard>
      </YStack>
    </Screen>
  )
}
