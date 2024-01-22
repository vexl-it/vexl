import {useFocusEffect} from '@react-navigation/native'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import IconButton from '../IconButton'
import FilterForm from '../OfferForm'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import closeSvg from '../images/closeSvg'
import {
  initializeOffersFilterOnDisplayActionAtom,
  resetFilterAtom,
  saveFilterActionAtom,
} from './atom'
import useContent from './useContent'

const styles = StyleSheet.create({
  contentStyles: {
    paddingBottom: 16,
  },
})

function FilterOffersScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const safeGoBack = useSafeGoBack()
  const content = useContent()
  const saveFilter = useSetAtom(saveFilterActionAtom)
  const resetFilter = useSetAtom(resetFilterAtom)
  const initializeOffersFilterOnDisplay = useSetAtom(
    initializeOffersFilterOnDisplayActionAtom
  )

  const resetOfferForm = useCallback(() => {
    resetFilter()
  }, [resetFilter])

  function onFilterOffersClose(): void {
    safeGoBack()
  }

  useFocusEffect(
    useCallback(() => {
      initializeOffersFilterOnDisplay()
    }, [initializeOffersFilterOnDisplay])
  )

  return (
    <Screen customHorizontalPadding={tokens.size[2].val}>
      <ScreenTitle text={t('filterOffers.filterResults')} withBottomBorder>
        <XStack ai="center" space="$2">
          <Button
            onPress={resetOfferForm}
            size="small"
            variant="primary"
            text={t('common.reset')}
          />
          <IconButton
            variant="dark"
            icon={closeSvg}
            onPress={onFilterOffersClose}
          />
        </XStack>
      </ScreenTitle>
      <ScrollView
        contentContainerStyle={styles.contentStyles}
        showsVerticalScrollIndicator={false}
      >
        <FilterForm content={content} />
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
