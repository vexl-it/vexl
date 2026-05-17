import Clipboard from '@react-native-clipboard/clipboard'
import {
  type InvoiceStatus,
  type PaymentLink,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Checkmark,
  ClockTime,
  Copy,
  Rejected,
  Stack,
  Typography,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTranslation} from '../utils/localization/I18nProvider'
import {SharableQrCode} from './SharableQrCode'
import {toastNotificationAtom} from './ToastNotification/atom'

interface Props {
  paymentLink: PaymentLink
  status: InvoiceStatus
  donationPaymentMethod: 'BTC-LN' | 'BTC-CHAIN' | 'BTC-LNURL'
  isInModal?: boolean
}
const QR_CODE_SIZE = 300

function BtcInvoiceStatus({
  donationPaymentMethod,
  paymentLink,
  status,
  isInModal,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const statusIconColor = theme.accentYellowPrimary.get()
  const copyIconColor = theme.foregroundSecondary.get()

  return (
    <Stack gap="$4">
      <Stack als="center">
        {status === 'New' ? (
          <Stack
            ai="center"
            jc="center"
            h={QR_CODE_SIZE + 10}
            w={QR_CODE_SIZE + 10}
            bc="$white100"
          >
            <SharableQrCode
              size={QR_CODE_SIZE}
              value={paymentLink}
              logo={
                donationPaymentMethod === 'BTC-CHAIN'
                  ? require('./images/btcLogo.png')
                  : require('./images/lightningLogo.png')
              }
            />
          </Stack>
        ) : (
          <>
            <SharableQrCode
              size={QR_CODE_SIZE}
              value={paymentLink}
              logo={
                donationPaymentMethod === 'BTC-CHAIN'
                  ? require('./images/btcLogo.png')
                  : require('./images/lightningLogo.png')
              }
            />
            <Stack
              height={QR_CODE_SIZE}
              width={QR_CODE_SIZE}
              ai="center"
              jc="center"
              bc="rgba(80, 79, 79, 0.9)"
              top={0}
              l={0}
              pos="absolute"
            >
              <Stack ai="center" jc="center" height={QR_CODE_SIZE}>
                <Stack
                  ai="center"
                  jc="center"
                  gap="$2"
                  height={200}
                  width={200}
                  bc="$backgroundSecondary"
                  borderRadius="$10"
                >
                  {status === 'Processing' ? (
                    <ClockTime size={64} color={statusIconColor} />
                  ) : status === 'Invalid' || status === 'Expired' ? (
                    <Rejected size={64} color={statusIconColor} />
                  ) : (
                    <Checkmark size={64} color={statusIconColor} />
                  )}
                  <Typography
                    color="$accentYellowPrimary"
                    variant="titlesSmall"
                    textAlign="center"
                  >
                    {t(`donations.invoiceStatus.${status}`)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
      {status === 'New' && !!isInModal && (
        <Stack gap="$1">
          <Typography variant="description" color="$foregroundSecondary">
            {donationPaymentMethod === 'BTC-LN'
              ? t('offerForm.network.lightning').toUpperCase()
              : t('offerForm.network.onChain').toUpperCase()}
          </Typography>
          <XStack ai="center" jc="space-between" gap="$2">
            <Typography
              flexShrink={1}
              color="$foregroundPrimary"
              variant="paragraphSmallBold"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {paymentLink}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(paymentLink)
                setToastNotification(t('common.copied'))
              }}
            >
              <Copy size={24} color={copyIconColor} />
            </TouchableOpacity>
          </XStack>
        </Stack>
      )}
    </Stack>
  )
}

export default BtcInvoiceStatus
