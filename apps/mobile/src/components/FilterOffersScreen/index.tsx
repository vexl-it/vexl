import {useFocusEffect} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import SvgImage from '../Image'
import FilterForm from '../OfferForm'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import Section from '../Section'
import infoSvg from '../images/infoSvg'
import sortingSvg from '../images/sortingSvg'
import userSvg from '../images/userSvg'
import {
  initializeOffersFilterOnDisplayActionAtom,
  listingTypeAtom,
  resetFilterOmitTextFilterActionAtom,
  saveFilterActionAtom,
  sortingAtom,
} from './atom'
import BaseFilter from './components/BaseFilter'
import Sorting from './components/Sorting'
import useBtcOffersFilterContent from './useBtcOffersFilterContent'
import useOtherOffersFilterContent from './useOtherOffersFilterContent'
import useProductOffersFilterContent from './useProductOffersFilterContent'

const styles = StyleSheet.create({
  contentStyles: {
    paddingBottom: 16,
  },
})

function FilterOffersScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()
  const btcOffersFilterContent = useBtcOffersFilterContent()
  const productOffersFilterContent = useProductOffersFilterContent()
  const otherOffersFilterContent = useOtherOffersFilterContent()
  const listingType = useAtomValue(listingTypeAtom)
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
        <XStack ai="center" space="$2">
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
        <Section title={t('filterOffers.whatIsTheGoal')} image={userSvg}>
          <BaseFilter />
        </Section>
        <Section title={t('filterOffers.sorting')} image={sortingSvg}>
          <Sorting sortingAtom={sortingAtom} />
        </Section>
        {listingType ? (
          <FilterForm
            content={
              listingType === 'OTHER'
                ? otherOffersFilterContent
                : listingType === 'PRODUCT'
                ? productOffersFilterContent
                : btcOffersFilterContent
            }
          />
        ) : (
          <XStack ai="center" jc="center" gap="$1">
            <SvgImage source={infoSvg} fill={tokens.color.white.val} />
            <Text col="white">
              {t('filterOffers.pleaseSelectListingTypeFirst')}
            </Text>
          </XStack>
        )}
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
