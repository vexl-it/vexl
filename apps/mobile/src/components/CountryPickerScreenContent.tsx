import {
  NavigationBar,
  Screen,
  SearchableSelectList,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React, {useMemo, useState} from 'react'
import {getAllCountries, type ICountry} from 'react-native-country-select'
import {useTranslation} from '../utils/localization/I18nProvider'

interface Props {
  readonly onClose: () => void
  readonly onSelect: (country: ICountry) => void
}

const POPULAR_COUNTRIES = ['CZ', 'SK', 'DE', 'IT']
const ALL_COUNTRIES = getAllCountries()

function getCountryName(country: ICountry): string {
  return country.translations.eng?.common ?? country.name.common
}

function normalizeCountrySearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function countryMatchesSearch(country: ICountry, searchQuery: string): boolean {
  if (searchQuery.length === 0) return true

  const normalizedQuery = normalizeCountrySearchValue(searchQuery)
  const normalizedName = normalizeCountrySearchValue(getCountryName(country))
  const callingCode = country.idd.root.toLowerCase()
  const countryCode = country.cca2.toLowerCase()

  return (
    normalizedName.includes(normalizedQuery) ||
    callingCode.includes(normalizedQuery) ||
    countryCode.includes(normalizedQuery)
  )
}

function isPopularCountry(country: ICountry): boolean {
  return POPULAR_COUNTRIES.includes(country.cca2)
}

function sortCountries(countries: readonly ICountry[]): ICountry[] {
  const sortedCountries = [...countries]

  sortedCountries.sort((first, second) =>
    normalizeCountrySearchValue(getCountryName(first)).localeCompare(
      normalizeCountrySearchValue(getCountryName(second))
    )
  )

  return sortedCountries
}

function getCountriesToDisplay(searchQuery: string): readonly ICountry[] {
  const popularCountries: ICountry[] = []
  const otherCountries: ICountry[] = []

  for (const popularCountryCode of POPULAR_COUNTRIES) {
    for (const country of ALL_COUNTRIES) {
      if (country.cca2 !== popularCountryCode) continue
      if (!countryMatchesSearch(country, searchQuery)) continue
      popularCountries.push(country)
    }
  }

  for (const country of ALL_COUNTRIES) {
    if (!countryMatchesSearch(country, searchQuery)) continue
    if (isPopularCountry(country)) continue

    otherCountries.push(country)
  }

  return [...popularCountries, ...sortCountries(otherCountries)]
}

function getCountryCode(country: ICountry): string {
  return country.cca2
}

function getCountryFlag(country: ICountry): string {
  return country.flag
}

function getCountryDialCode(country: ICountry): string {
  return country.idd.root
}

export default function CountryPickerScreenContent({
  onClose,
  onSelect,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [searchQueryAtom] = useState(() => atom(''))
  const searchQuery = useAtomValue(searchQueryAtom)
  const rightActions = useMemo(
    () => [{icon: XmarkCancelClose, onPress: onClose}],
    [onClose]
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('loginFlow.phoneNumber.enterYourCountry')}
          rightActions={rightActions}
        />
      }
      safeAreasBackgroundColor="$backgroundPrimary"
    >
      <SearchableSelectList
        items={getCountriesToDisplay(searchQuery)}
        keyExtractor={getCountryCode}
        getLabel={getCountryName}
        getEmoji={getCountryFlag}
        getPrefix={getCountryDialCode}
        onSelect={onSelect}
        searchValueAtom={searchQueryAtom}
        searchPlaceholder={t('common.search')}
        emptyTitle={t('common.nothingFound')}
      />
    </Screen>
  )
}
