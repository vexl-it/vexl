import Clipboard from '@react-native-clipboard/clipboard'
import {
  type InvoiceStatus,
  type PaymentLink,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import Image from './Image'
import checkIconSvg from './images/checkIconSvg'
import clockSvg from './images/clockSvg'
import copySvg from './images/copySvg'
import slashSvg from './images/slashSvg'
import successfulSvg from './images/successfulSvg'
import {SharableQrCode} from './SharableQrCode'
import {toastNotificationAtom} from './ToastNotification/atom'

interface Props {
  paymentLink: PaymentLink
  status: InvoiceStatus
  donationPaymentMethod: 'BTC-LN' | 'BTC-CHAIN' | 'BTC-LNURL'
  isInModal?: boolean
}
const QR_CODE_SIZE = 300
const PROCESSING_STATUSES: InvoiceStatus[] = ['Processing']
const ERROR_STATUSES: InvoiceStatus[] = ['Invalid', 'Expired']

function BtcInvoiceStatus({
  donationPaymentMethod,
  paymentLink,
  status,
  isInModal,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack gap="$4">
      <Stack als="center">
        {status === 'New' ? (
          <Stack
            ai="center"
            jc="center"
            h={QR_CODE_SIZE + 1}
            w={QR_CODE_SIZE + 1}
            bc="$white"
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
                  bc="$grey"
                  borderRadius="$10"
                >
                  <Image
                    height={64}
                    width={64}
                    source={
                      PROCESSING_STATUSES.includes(status)
                        ? clockSvg
                        : ERROR_STATUSES.includes(status)
                          ? slashSvg
                          : successfulSvg
                    }
                    stroke={getTokens().color.main.val}
                  />
                  <Text col="$main" ff="$body500" fos={24} textAlign="center">
                    {t(`donations.invoiceStatus.${status}`)}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
      {status === 'New' && !!isInModal && (
        <Stack gap="$1">
          <Text col="$grey" ff="$body500">
            {donationPaymentMethod === 'BTC-LN'
              ? t('offerForm.network.lightning').toUpperCase()
              : t('offerForm.network.onChain').toUpperCase()}
          </Text>
          <XStack ai="center" jc="space-between" gap="$2">
            <Text
              flexShrink={1}
              col="$grey"
              fos={16}
              ff="$body600"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {paymentLink}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(paymentLink)
                setToastNotification({
                  visible: true,
                  text: t('common.copied'),
                  icon: checkIconSvg,
                })
              }}
            >
              <Image source={copySvg} fill={getTokens().color.grey.val} />
            </TouchableOpacity>
          </XStack>
        </Stack>
      )}
    </Stack>
  )
}

export default BtcInvoiceStatus
