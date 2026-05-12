import {
  Input,
  NavigationBar,
  SearchMagnifyGlass,
  tokens,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useState} from 'react'
import {FlatList} from 'react-native'
import {getAllCountries, type ICountry} from 'react-native-country-select'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {selectedCountryCodeAtom} from '../atoms/selectedCountryCodeAtom'

type Props = LoginFlowStackScreenProps<'CountryPicker'>

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
    <XStack
      alignItems="center"
      borderBottomColor="$backgroundTertiary"
      borderBottomWidth={1}
      gap="$3"
      minHeight="$11"
      onPress={handleSelect}
      pressStyle={{opacity: 0.7}}
      width="100%"
    >
      <Typography color="$foregroundPrimary" variant="heading3">
        {country.flag}
      </Typography>
      <Typography
        color="$foregroundSecondary"
        minWidth={tokens.size[11].val}
        variant="paragraphSmall"
      >
        {country.idd.root}
      </Typography>
      <Typography
        color="$foregroundPrimary"
        flex={1}
        numberOfLines={1}
        variant="paragraph"
      >
        {getCountryName(country)}
      </Typography>
    </XStack>
  )
}

export default function CountryPickerScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const countriesToDisplay = getCountriesToDisplay(searchQuery)
  const setSelectedCountryCode = useSetAtom(selectedCountryCodeAtom)
  const rightActions = useMemo(
    () => [{icon: XmarkCancelClose, onPress: navigation.goBack}],
    [navigation.goBack]
  )

  const handleSelect = useCallback(
    (country: ICountry) => {
      setSelectedCountryCode(country.cca2)
      navigation.goBack()
    },
    [navigation, setSelectedCountryCode]
  )

  const renderItem = useCallback(
    ({item}: {readonly item: ICountry}) => (
      <CountryPickerItem country={item} onSelect={handleSelect} />
    ),
    [handleSelect]
  )

  const keyExtractor = useCallback((item: ICountry) => item.cca2, [])

  return (
    <YStack
      backgroundColor="$backgroundPrimary"
      flex={1}
      paddingBottom={insets.bottom}
      paddingTop={insets.top + tokens.space[5].val}
    >
      <NavigationBar
        style="back"
        title={t('loginFlow.phoneNumber.enterYourCountry')}
        rightActions={rightActions}
      />
      <XStack
        alignItems="center"
        backgroundColor="$backgroundSecondary"
        borderRadius="$9"
        gap="$3"
        height="$11"
        marginHorizontal="$5"
        paddingHorizontal="$5"
      >
        <SearchMagnifyGlass
          color={theme.foregroundPrimary.val}
          size={tokens.size[7].val}
        />
        <Input
          unstyled
          autoCorrect={false}
          color="$foregroundPrimary"
          flex={1}
          fontFamily="$body"
          fontSize="$5"
          fontWeight="500"
          onChangeText={setSearchQuery}
          padding={0}
          placeholder={t('common.search')}
          placeholderTextColor={theme.foregroundSecondary.val}
          selectionColor={theme.accentYellowPrimary.val}
          value={searchQuery}
        />
      </XStack>
      <FlatList
        contentContainerStyle={{
          paddingBottom: tokens.space[8].val,
          paddingHorizontal: tokens.space[5].val,
          paddingTop: tokens.space[5].val,
        }}
        data={countriesToDisplay}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  )
}
