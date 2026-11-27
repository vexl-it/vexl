import {Banner, ReachNetworkGraphic, StatBanner} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import {type CountryCode} from 'libphonenumber-js'
import React from 'react'
import {getAllCountries} from 'react-native-country-select'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {useShowReachExplanation} from '../../../../useShowReachExplanation'
import {type ReachBannerPage} from '../reachBannerPages'

function countryName(country: CountryCode, locale: string): string | undefined {
  if (typeof Intl.DisplayNames === 'function') {
    return new Intl.DisplayNames([locale], {type: 'region'}).of(country)
  }
  return pipe(
    getAllCountries(),
    Array.findFirst((item) => item.cca2 === country),
    Option.map((item) => item.name.common),
    Option.getOrUndefined
  )
}

export default function ReachBannerPageContent({
  page,
  country,
  countryOffers,
  offersSeen,
  reach,
}: {
  readonly page: ReachBannerPage
  readonly country: CountryCode | undefined
  readonly countryOffers: number | undefined
  readonly offersSeen: number
  readonly reach: number
}): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const showReachExplanation = useShowReachExplanation()
  if (page === 'network')
    return (
      <Banner
        color="neutral"
        fillHeight
        leading={<ReachNetworkGraphic />}
        title={t('contactPreferences.reachBanner.networkTitle')}
        description={t('contactPreferences.reachBanner.networkDescription')}
      />
    )
  if (page === 'offers') {
    const name =
      country === undefined ? undefined : countryName(country, locale)
    const count = countryOffers ?? 0
    return (
      <StatBanner
        color="green"
        fillHeight
        label={
          name === undefined
            ? t('contactPreferences.reachBanner.offersLabelRegion')
            : t('contactPreferences.reachBanner.offersLabel', {country: name})
        }
        value={t('contactPreferences.reachBanner.offersCount', {
          count,
          localizedString: formatInteger(count, locale),
        })}
        description={
          offersSeen === 0
            ? t('contactPreferences.reachBanner.offersSeenZero')
            : t('contactPreferences.reachBanner.offersSeen', {
                count: offersSeen,
                localizedString: formatInteger(offersSeen, locale),
              })
        }
      />
    )
  }
  return (
    <StatBanner
      color="yellow"
      fillHeight
      onPress={showReachExplanation}
      label={t('account.reachStats.title')}
      value={
        reach === 0
          ? t('contactPreferences.reachBanner.noOne')
          : t('contactPreferences.contactReach.people', {
              count: reach,
              localizedString: formatInteger(reach, locale),
            })
      }
      description={
        reach === 0
          ? t('contactPreferences.reachBanner.descriptionZero')
          : t('contactPreferences.reachBanner.description', {count: reach})
      }
    />
  )
}
