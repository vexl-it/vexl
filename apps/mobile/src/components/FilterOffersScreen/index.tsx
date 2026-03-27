import {useFocusEffect} from '@react-navigation/native'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import FilterForm from '../OfferForm'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import Section from '../Section'
import sortingSvg from '../images/sortingSvg'
import {
  initializeOffersFilterOnDisplayActionAtom,
  resetFilterOmitTextFilterActionAtom,
  saveFilterActionAtom,
  sortingAtom,
} from './atom'
import Sorting from './components/Sorting'
import useBtcOffersFilterContent from './useBtcOffersFilterContent'

const styles = StyleSheet.create({
  contentStyles: {
    paddingBottom: 16,
  },
})

function FilterOffersScreen(): React.ReactElement {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()
  const btcOffersFilterContent = useBtcOffersFilterContent()
  // const productOffersFilterContent = useProductOffersFilterContent()
  // const otherOffersFilterContent = useOtherOffersFilterContent()
  // const allOffersFilterContent = useAllOffersFilterContent()
  // const filterBarOptions = useAtomValue(filterBarOptionsAtom)
  const saveFilter = useSetAtom(saveFilterActionAtom)
  const resetFilterOmitTextFilter = useSetAtom(
    resetFilterOmitTextFilterActionAtom
  )
  const initializeOffersFilterOnDisplay = useSetAtom(
    initializeOffersFilterOnDisplayActionAtom
  )

  const resetOfferForm = useCallback(() => {
    resetFilterOmitTextFilter()
    saveFilter()
    safeGoBack()
  }, [resetFilterOmitTextFilter, safeGoBack, saveFilter])

  useFocusEffect(
    useCallback(() => {
      initializeOffersFilterOnDisplay()
    }, [initializeOffersFilterOnDisplay])
  )

  return (
    <Screen customHorizontalPadding={tokens.size[2].val}>
      <ScreenTitle
        text={t('filterOffers.filterResults')}
        withBottomBorder
        withBackButton
      >
        <XStack ai="center" gap="$2">
          <Button
            onPress={resetOfferForm}
            size="small"
            variant="primary"
            text={t('common.reset')}
          />
        </XStack>
      </ScreenTitle>
      <ScrollView
        contentContainerStyle={styles.contentStyles}
        showsVerticalScrollIndicator={false}
      >
        <Section title={t('filterOffers.sorting')} image={sortingSvg}>
          <Sorting sortingAtom={sortingAtom} />
        </Section>
        <FilterForm content={btcOffersFilterContent} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('common.save')}
          onPress={() => {
            saveFilter()
            safeGoBack()
          }}
          variant="secondary"
        />
      </Stack>
    </Screen>
  )
}

export default FilterOffersScreen
