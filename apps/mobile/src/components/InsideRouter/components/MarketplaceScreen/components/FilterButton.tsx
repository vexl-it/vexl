import {useNavigation} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack} from 'tamagui'
import {isFilterActiveAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import Image from '../../../../Image'
import filterSvg from '../../../images/filterSvg'

function FilterButton(): React.ReactElement {
  const navigation = useNavigation()
  const isFilterActive = useAtomValue(isFilterActiveAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('FilterOffers')
      }}
    >
      <Stack
        w={56}
        h={56}
        ai="center"
        jc="center"
        bc={isFilterActive ? '$main' : '$grey'}
        br="$6"
      >
        <Image
          stroke={
            isFilterActive
              ? getTokens().color.darkBrown.val
              : getTokens().color.greyOnBlack.val
          }
          source={filterSvg}
        />
      </Stack>
    </TouchableOpacity>
  )
}

export default FilterButton
