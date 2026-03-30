import {Typography} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList, TouchableWithoutFeedback} from 'react-native'
import {getTokens, Stack, XStack} from 'tamagui'

import chevronRightSvg from '../../../../../images/chevronRightSvg'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import closeSvg from '../../../../images/closeSvg'
import selectedCheckSvg from '../images/selectedCheckSvg'

export interface Item<T> {
  data: T
  key: string
  outdated?: boolean
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
}): React.ReactElement {
  const {t} = useTranslation()
  const item = useAtomValue(itemAtom)
  const {selected} = item

  return (
    <TouchableWithoutFeedback
      disabled={item.outdated}
      onPress={() => {
        onPress(item.data)
      }}
    >
      <XStack
        mt="$2"
        gap="$2"
        ai="center"
        jc="space-between"
        bc={item.outdated ? '$blackAccent1' : '$grey'}
        px="$4"
        py="$5"
        br="$4"
      >
        <Stack fs={1} gap="$2">
          <Typography
            variant="paragraphSmallBold"
            mih={24}
            color={
              selected
                ? '$accentHighlightPrimary'
                : item.outdated
                  ? '$foregroundTertiary'
                  : '$foregroundPrimary'
            }
          >
            {item.title}
          </Typography>
          {!!item.rightText && (
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.rightText}
            </Typography>
          )}
        </Stack>
        {!!showChevron && <Image stroke="#AFAFAF" source={chevronRightSvg} />}
        {!!selected && <Image source={selectedCheckSvg}></Image>}
        {!!item.outdated && (
          <XStack ai="center" gap="$1" p="$1">
            <Image
              height={12}
              width={12}
              source={closeSvg}
              stroke={getTokens().color.yellow100.val}
            />
            <Typography variant="micro" color="$accentHighlightPrimary">
              {t('common.outdated')}
            </Typography>
          </XStack>
        )}
      </XStack>
    </TouchableWithoutFeedback>
  )
}

function OptionsList<T>({
  showChevron,
  items,
  onItemPress,
}: Props<T>): React.ReactElement {
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
