import {useAtomValue, type Atom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {tokens} from '../../../../../utils/ThemeProvider/tamagui.config'

import chevronRightSvg from '../../../../../images/chevronRightSvg'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import Image from '../../../../Image'
import selectedCheckSvg from '../images/selectedCheckSvg'

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
        gap="$2"
        ai="center"
        jc="space-between"
        bc="$grey"
        px="$4"
        py="$5"
        br="$4"
      >
        <Stack fs={1} gap="$2">
          <Text
            h={24}
            color={selected ? '$main' : '$white'}
            fos={16}
            ff="$body600"
          >
            {item.title}
          </Text>
          {!!item.rightText && (
            <Text
              fos={12}
              ff="$body500"
              color="$greyOnBlack"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.rightText}
            </Text>
          )}
        </Stack>
        {!!showChevron && (
          <Image
            stroke={tokens.color.greyOnBlack.val}
            source={chevronRightSvg}
          />
        )}
        {!!selected && <Image source={selectedCheckSvg}></Image>}
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
