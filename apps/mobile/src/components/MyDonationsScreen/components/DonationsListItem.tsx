import {useNavigation} from '@react-navigation/native'
import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import chevronRightSvg from '../../../images/chevronRightSvg'
import {type MyDonation} from '../../../state/donations/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import bitcoinSvg from '../images/bitcoinSvg'
import lightningSvg from '../images/lightningSvg'

function IvoiceStatusIndicator({status}: {status: InvoiceStatus}): JSX.Element {
  const {t} = useTranslation()

  const color = useMemo(() => {
    switch (status) {
      case 'Settled':
      case 'Processing':
      case 'New':
        return '$main'
      default:
        return '$greyAccent2'
    }
  }, [status])

  return (
    <Stack
      ai="center"
      jc="center"
      p="$2"
      br="$4"
      borderColor={color}
      borderWidth={1}
    >
      <Text fos={16} ff="$body500" col={color}>
        {t(`donations.invoiceStatus.${status}`)}
      </Text>
    </Stack>
  )
}

function DonationsListItem({donation}: {donation: MyDonation}): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()

  const expiresIn = Math.floor(
    DateTime.fromSeconds(donation.expirationTime).diff(
      DateTime.now(),
      'minutes'
    ).minutes
  )

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('DonationDetails', {
          invoiceId: donation.invoiceId,
        })
      }}
    >
      <XStack ai="center" jc="space-between" gap="$2">
        <XStack fs={1} ai="center" gap="$4">
          <Image
            height={38}
            width={38}
            source={
              donation.paymentMethod === 'BTC-CHAIN' ? bitcoinSvg : lightningSvg
            }
          />
          <Stack fs={1}>
            <Text fontSize={16} fontFamily="$body500">
              {donation.paymentMethod === 'BTC-LN'
                ? t('offerForm.network.lightning')
                : t('offerForm.network.onChain')}
            </Text>
            {expiresIn > 0 && (
              <Text>{t('donations.expiresIn', {minutes: expiresIn})}</Text>
            )}
            {(expiresIn <= 0 || donation.status === 'Settled') && (
              <Text numberOfLines={3}>
                {t('donations.createdAt', {
                  dateTime: DateTime.fromSeconds(
                    donation.createdTime
                  ).toLocaleString(DateTime.DATETIME_MED),
                })}
              </Text>
            )}
          </Stack>
        </XStack>
        <XStack ai="center" gap="$2">
          <IvoiceStatusIndicator status={donation.status} />
          <Image
            stroke={getTokens().color.white.val}
            source={chevronRightSvg}
          />
        </XStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default DonationsListItem
