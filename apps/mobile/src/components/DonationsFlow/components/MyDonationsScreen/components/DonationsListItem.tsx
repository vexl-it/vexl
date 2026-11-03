import {useNavigation} from '@react-navigation/native'
import {Circle, TwoToneCard, Typography, XStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {type DonationsFlowScreenProps} from '../../../../../navigationTypes'
import {type MyDonation} from '../../../../../state/donations/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  formatDateTime,
  formatInteger,
  type FormattingLocale,
} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {localizedPriceActionAtom} from '../../../../../utils/localization/localizedNumbersAtoms'
import {donationTitle, timestampToDateTime} from '../../../utils'
import {DonationStatusTag} from '../../DonationStatusTag'

function expiresInText({
  expirationTime,
  locale,
  t,
}: {
  readonly expirationTime: number
  readonly locale: FormattingLocale
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
      : t('donations.expiresInDays', {
          days: formatInteger(expiresInDays, locale),
        })
  }

  if (expiresInMinutes >= 60) {
    const expiresInHours = Math.ceil(expiresInMinutes / 60)

    return expiresInHours === 1
      ? t('donations.expiresInOneHour')
      : t('donations.expiresInHours', {
          hours: formatInteger(expiresInHours, locale),
        })
  }

  return expiresInMinutes === 1
    ? t('donations.expiresInOneMinute')
    : t('donations.expiresIn', {
        minutes: formatInteger(expiresInMinutes, locale),
      })
}

function DonationsListItem({
  donation,
}: {
  readonly donation: MyDonation
}): React.ReactElement {
  const navigation =
    useNavigation<DonationsFlowScreenProps<'MyDonations'>['navigation']>()
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const expiresIn = expiresInText({
    expirationTime: donation.expirationTime,
    locale,
    t,
  })

  const localizedFiatAmount = useSetAtom(localizedPriceActionAtom)({
    number: donation.fiatAmount,
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const createdAt = formatDateTime(
    timestampToDateTime(donation.createdTime).toMillis(),
    locale
  )
  const shouldShowExpiry = donation.status === 'New' && !!expiresIn

  return (
    <TwoToneCard
      onPress={() => {
        navigation.navigate('DonationDetails', {
          invoiceId: donation.invoiceId,
        })
      }}
    >
      <TwoToneCard.Header gap="$2">
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
      </TwoToneCard.Header>
      <TwoToneCard.Content>
        <Typography variant="tabSmall" color="$foregroundPrimary">
          {localizedFiatAmount}
        </Typography>
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}

export default DonationsListItem
