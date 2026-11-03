import {
  type InvoiceStatus,
  type PaymentLink,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Backdrop,
  Checkmark,
  ClockTime,
  Rejected,
  Stack,
  Typography,
  useTheme,
} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import {SharableQrCode} from './SharableQrCode'

interface Props {
  paymentLink: PaymentLink
  status: InvoiceStatus
  donationPaymentMethod: 'BTC-LN' | 'BTC-CHAIN' | 'BTC-LNURL'
}
const QR_CODE_SIZE = 300
const STATUS_CARD_SIZE = 200

function StatusIcon({status}: {status: InvoiceStatus}): React.ReactElement {
  const theme = useTheme()
  const Icon =
    status === 'Processing'
      ? ClockTime
      : status === 'Invalid' || status === 'Expired'
        ? Rejected
        : Checkmark

  return (
    <Icon
      size={getTokens().size.$12.val}
      color={theme.accentYellowPrimary.get()}
    />
  )
}

function BtcInvoiceStatus({
  donationPaymentMethod,
  paymentLink,
  status,
}: Props): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack
      als="center"
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
      {status !== 'New' ? (
        <>
          <Backdrop opacity={0.9} />
          <Stack position="absolute" inset={0} ai="center" jc="center">
            <Stack
              ai="center"
              jc="center"
              gap="$2"
              height={STATUS_CARD_SIZE}
              width={STATUS_CARD_SIZE}
              bc="$backgroundSecondary"
              borderRadius="$10"
            >
              <StatusIcon status={status} />
              <Typography
                color="$accentYellowPrimary"
                variant="titlesSmall"
                textAlign="center"
              >
                {t(`donations.invoiceStatus.${status}`)}
              </Typography>
            </Stack>
          </Stack>
        </>
      ) : null}
    </Stack>
  )
}

export default BtcInvoiceStatus
