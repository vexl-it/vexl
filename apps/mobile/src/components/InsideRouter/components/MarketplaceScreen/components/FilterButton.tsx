import {useNavigation} from '@react-navigation/native'
import {IconButton, TuneSettings, useTheme} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {isFilterActiveAtom} from '../../../../../state/marketplace/atoms/filterAtoms'

function FilterButton(): React.JSX.Element {
  const navigation = useNavigation()
  const isFilterActive = useAtomValue(isFilterActiveAtom)
  const theme = useTheme()

  return (
    <IconButton
      showBadge={isFilterActive}
      onPress={() => {
        navigation.navigate('FilterOffers')
      }}
    >
      <TuneSettings size={24} color={theme.foregroundPrimary.val} />
    </IconButton>
  )
}

export default FilterButton
