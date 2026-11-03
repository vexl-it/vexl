import {
  KeyboardAvoidingView,
  NavigationBar,
  Screen,
  SearchBar,
  SelectableItem,
  tokens,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React, {useCallback, useMemo, useState} from 'react'
import {FlatList, Platform} from 'react-native'
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

function CountryPickerItem({
  country,
  onSelect,
}: {
  readonly country: ICountry
  readonly onSelect: (country: ICountry) => void
}): React.ReactElement {
  const handleSelect = useCallback(() => {
    onSelect(country)
  }, [country, onSelect])

  return (
    <SelectableItem
      label={`${country.flag} ${getCountryName(country)}`}
      note={country.idd.root}
      onPress={handleSelect}
    />
  )
}

export default function CountryPickerScreenContent({
  onClose,
  onSelect,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [searchQueryAtom] = useState(() => atom(''))
  const searchQuery = useAtomValue(searchQueryAtom)
  const countriesToDisplay = getCountriesToDisplay(searchQuery)
  const rightActions = useMemo(
    () => [{icon: XmarkCancelClose, onPress: onClose}],
    [onClose]
  )

  const renderItem = useCallback(
    ({item}: {readonly item: ICountry}) => (
      <CountryPickerItem country={item} onSelect={onSelect} />
    ),
    [onSelect]
  )

  const keyExtractor = useCallback((item: ICountry) => item.cca2, [])
  const listBottomPadding =
    tokens.space[8].val + (Platform.OS === 'android' ? tokens.size[11].val : 0)

  const countryList = (
    <FlatList
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={{
        paddingBottom: listBottomPadding,
        paddingTop: tokens.space[4].val,
      }}
      data={countriesToDisplay}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={{flex: 1}}
    />
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
      <SearchBar valueAtom={searchQueryAtom} placeholder={t('common.search')} />
      {Platform.OS === 'android' ? (
        <KeyboardAvoidingView>{countryList}</KeyboardAvoidingView>
      ) : (
        countryList
      )}
    </Screen>
  )
}
