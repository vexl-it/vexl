import {
  Checkmark,
  ChevronRight,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList, TouchableWithoutFeedback} from 'react-native'

import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

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
  const theme = useTheme()
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
        marginTop="$2"
        gap="$2"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={
          item.outdated ? '$backgroundTertiary' : '$backgroundSecondary'
        }
        paddingHorizontal="$4"
        paddingVertical="$5"
        borderRadius="$4"
      >
        <Stack flexShrink={1} gap="$2">
          <Typography
            variant="paragraphSmallBold"
            minHeight={24}
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
        {!!showChevron && (
          <ChevronRight size={20} color={theme.foregroundTertiary.get()} />
        )}
        {!!selected && (
          <Checkmark size={20} color={theme.accentHighlightSecondary.get()} />
        )}
        {!!item.outdated && (
          <XStack alignItems="center" gap="$1" padding="$1">
            <XmarkCancelClose
              size={12}
              color={theme.accentHighlightSecondary.get()}
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
