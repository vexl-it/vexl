import Clipboard from '@react-native-clipboard/clipboard'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../state/currentBtcPriceAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import checkIconSvg from '../../ChatDetailScreen/components/images/checkIconSvg'
import Image from '../../Image'
import copySvg from '../../images/copySvg'
import {SharableQrCode} from '../../SharableQrCode'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {donationPaymentMethodAtom} from '../atoms'

interface Props {
  readonly currency: 'EUR'
  readonly btcAmount: number
  readonly fiatAmount: number
  readonly invoiceId: string
  readonly storeId: string
  readonly exchangeRate: number
  readonly paymentLink: string
}

function DonationQrCode({
  btcAmount,
  currency,
  exchangeRate,
  fiatAmount,
  paymentLink,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const satsAmount = btcAmount * SATOSHIS_IN_BTC
  const exchangeRateInfo = Math.round(exchangeRate) / SATOSHIS_IN_BTC
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const donationPaymentMethod = useAtomValue(donationPaymentMethodAtom)

  return (
    <Stack height={570} gap="$4">
      <Text col="$black" fos={28} ff="$heading" textAlign="center">
        {t('donationPrompt.vexlFoundationDonate')}
      </Text>
      <Stack gap="$2">
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.totalPrice')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`${satsAmount} sats`}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.totalFiat')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`${fiatAmount} ${currency}`}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.exchangeRate')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`1 sat = ${exchangeRateInfo} ${currency}`}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.amountDue')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`${satsAmount} sats`}
          </Text>
        </XStack>
      </Stack>
      <Stack als="center">
        <SharableQrCode
          size={300}
          value={paymentLink}
          logo={require('../images/btcLogo.png')}
        />
      </Stack>
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
    </Stack>
  )
}

export default DonationQrCode
