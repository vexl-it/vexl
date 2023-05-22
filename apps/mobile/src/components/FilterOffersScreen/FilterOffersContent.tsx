import {ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../ScreenTitle'
import IconButton from '../IconButton'
import refreshSvg from '../images/refreshSvg'
import closeSvg from '../images/closeSvg'
import FilterForm from '../OfferForm'
import {Stack} from 'tamagui'
import Button from '../Button'
import React, {useCallback} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useContent from './useContent'
import {useMolecule} from 'jotai-molecules'
import {filterOffersMolecule} from './atom'
import {useSetAtom} from 'jotai'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

interface Props {
  navigateBack: () => void
}

function FilterOffersContent({navigateBack}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
  const {resetFilterAtom, setFilterAtom} = useMolecule(filterOffersMolecule)
  const setFilter = useSetAtom(setFilterAtom)
  const resetFilter = useSetAtom(resetFilterAtom)
  const resetOfferForm = useCallback(() => {
    resetFilter()
  }, [resetFilter])
  return (
    <>
      <ScrollView contentContainerStyle={styles.contentStyles}>
        <ScreenTitle text={t('filterOffers.filterResults')} withBottomBorder>
          <IconButton
            variant="dark"
            icon={refreshSvg}
            onPress={resetOfferForm}
          />
          <IconButton variant="dark" icon={closeSvg} onPress={navigateBack} />
        </ScreenTitle>
        <FilterForm content={content} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('common.confirm')}
          onPress={() => {
            setFilter()
            navigateBack()
          }}
          variant="secondary"
        />
      </Stack>
    </>
  )
}

export default FilterOffersContent
