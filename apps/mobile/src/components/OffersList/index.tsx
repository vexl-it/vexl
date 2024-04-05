import {FlashList} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom} from 'jotai'
import React, {useMemo, type ComponentProps} from 'react'
import {type FlatList} from 'react-native'
import {getTokens} from 'tamagui'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'

export interface Props {
  readonly offersAtoms: Array<Atom<OneOfferInState>>
  onRefresh?: () => void
  refreshing?: boolean
  ListHeaderComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent']
}

function renderItem({
  item,
  index,
}: {
  item: Atom<OneOfferInState>
  index: number
}): JSX.Element {
  return <OffersListItem isFirst={index === 0} offerAtom={item} />
}

function OffersList({
  onRefresh,
  refreshing,
  offersAtoms,
  ListHeaderComponent,
}: Props): JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomOffset + Number(getTokens().space[5].val),
    }),
    [bottomOffset]
  )

  return (
    <FlashList
      ListHeaderComponent={ListHeaderComponent}
      estimatedItemSize={151}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      data={offersAtoms}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={renderItem}
      keyExtractor={atomKeyExtractor}
    />
  )
}

export default OffersList
