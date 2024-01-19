import {FlatList, TouchableWithoutFeedback} from 'react-native'
import {Text, XStack} from 'tamagui'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import Image from '../../../../Image'
import React, {useCallback} from 'react'
import {tokens} from '../../../../../utils/ThemeProvider/tamagui.config'
import selectedCheckSvg from '../images/selectedCheckSvg'
import {type Atom, useAtomValue} from 'jotai'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'

export interface Item<T> {
  data: T
  key: string
  title: string
  selected?: boolean
  rightText?: string
}

interface Props<T> {
  showChevron?: boolean
  onItemPress: (data: T) => void
  items: Array<Atom<Item<T>>>
}

function Item<T>({
  item: itemAtom,
  onPress,
  showChevron,
}: {
  item: Atom<Item<T>>
  onPress: (item: T) => void
  showChevron?: boolean
}): JSX.Element {
  const item = useAtomValue(itemAtom)
  const {selected} = item

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onPress(item.data)
      }}
    >
      <XStack
        mt="$2"
        ai="center"
        jc="space-between"
        bc="$grey"
        px="$4"
        py="$5"
        br="$4"
      >
        <Text
          h={24}
          color={selected ? '$main' : '$white'}
          fos={16}
          ff="$body600"
        >
          {item.title}
        </Text>
        <XStack space="$2" ai="center">
          {item.rightText && (
            <Text fos={12} ff="$body500" color="$greyOnBlack">
              {item.rightText}
            </Text>
          )}
          {selected && <Image source={selectedCheckSvg}></Image>}
          {showChevron && (
            <Image
              stroke={tokens.color.greyOnBlack.val}
              source={chevronRightSvg}
            />
          )}
        </XStack>
      </XStack>
    </TouchableWithoutFeedback>
  )
}

function OptionsList<T>({
  showChevron,
  items,
  onItemPress,
}: Props<T>): JSX.Element {
  const renderItem = useCallback(
    ({item}: {item: Atom<Item<T>>}) => {
      return (
        <Item item={item} showChevron={showChevron} onPress={onItemPress} />
      )
    },
    [showChevron, onItemPress]
  )

  return (
    <FlatList
      data={items}
      keyExtractor={atomKeyExtractor}
      renderItem={renderItem}
    />
  )
}

export default OptionsList
