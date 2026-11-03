import {useNavigation} from '@react-navigation/native'
import {NavButton, TuneSettings} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {isFilterActiveAtom} from '../../../../../state/marketplace/atoms/filterAtoms'

function FilterButton(): React.JSX.Element {
  const navigation = useNavigation()
  const isFilterActive = useAtomValue(isFilterActiveAtom)

  return (
    <NavButton
      variant="secondary"
      icon={TuneSettings}
      badge={isFilterActive}
      onPress={() => {
        navigation.navigate('FilterOffers')
      }}
    />
  )
}

export default FilterButton
