import {useNavigation} from '@react-navigation/native'
import {Circle, Typography, XStack, YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {styled} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../../../../navigationTypes'
import {type MyDonation} from '../../../../../state/donations/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {localizedPriceActionAtom} from '../../../../../utils/localization/localizedNumbersAtoms'
import {donationTitle, timestampToDateTime} from '../../../utils'
import {DonationStatusTag} from '../../DonationStatusTag'

const CardFrame = styled(YStack, {
  name: 'DonationListItem',
  gap: '$0.5',
  pressStyle: {
    opacity: 0.7,
  },
})

const HeaderFrame = styled(YStack, {
  name: 'DonationListItemHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

const ContentFrame = styled(YStack, {
  name: 'DonationListItemContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
})

function expiresInText({
  expirationTime,
  t,
}: {
  readonly expirationTime: number
  readonly t: ReturnType<typeof useTranslation>['t']
}): string | undefined {
  const expirationDateTime = timestampToDateTime(expirationTime)
  const expiresInMinutes = Math.ceil(
    expirationDateTime.diff(DateTime.now(), 'minutes').minutes
  )

  if (expiresInMinutes <= 0) return undefined

  if (expiresInMinutes >= 60 * 24) {
    const expiresInDays = Math.ceil(expiresInMinutes / (60 * 24))

    return expiresInDays === 1
      ? t('donations.expiresInOneDay')
      : t('donations.expiresInDays', {days: expiresInDays})
  }

  if (expiresInMinutes >= 60) {
    const expiresInHours = Math.ceil(expiresInMinutes / 60)

    return expiresInHours === 1
      ? t('donations.expiresInOneHour')
      : t('donations.expiresInHours', {hours: expiresInHours})
  }

  return expiresInMinutes === 1
    ? t('donations.expiresInOneMinute')
    : t('donations.expiresIn', {minutes: expiresInMinutes})
}

function DonationsListItem({
  donation,
}: {
  readonly donation: MyDonation
}): React.ReactElement {
  const navigation =
    useNavigation<DonationsFlowScreenProps<'MyDonations'>['navigation']>()
  const {t} = useTranslation()
  const expiresIn = expiresInText({
    expirationTime: donation.expirationTime,
    t,
  })

  const localizedFiatAmount = useSetAtom(localizedPriceActionAtom)({
    number: donation.fiatAmount,
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const createdAt = timestampToDateTime(donation.createdTime).toLocaleString(
    DateTime.DATETIME_MED
  )
  const shouldShowExpiry = donation.status === 'New' && !!expiresIn

  return (
    <CardFrame
      onPress={() => {
        navigation.navigate('DonationDetails', {
          invoiceId: donation.invoiceId,
        })
      }}
    >
      <HeaderFrame gap="$2">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
          <Typography
            variant="descriptionBold"
            color="$foregroundPrimary"
            numberOfLines={1}
            flexShrink={1}
          >
            {donationTitle({paymentMethod: donation.paymentMethod, t})}
          </Typography>
          <DonationStatusTag status={donation.status} />
        </XStack>
        <XStack alignItems="center" gap="$2" flexShrink={1}>
          <Typography
            variant="micro"
            color="$foregroundSecondary"
            numberOfLines={1}
            flexShrink={1}
          >
            {createdAt}
          </Typography>
          {shouldShowExpiry ? (
            <>
              <Circle size="$2" backgroundColor="$foregroundSecondary" />
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
                flexShrink={1}
              >
                {expiresIn}
              </Typography>
            </>
          ) : null}
        </XStack>
      </HeaderFrame>
      <ContentFrame>
        <Typography variant="tabSmall" color="$foregroundPrimary">
          {localizedFiatAmount}
        </Typography>
      </ContentFrame>
    </CardFrame>
  )
}

export default DonationsListItem
