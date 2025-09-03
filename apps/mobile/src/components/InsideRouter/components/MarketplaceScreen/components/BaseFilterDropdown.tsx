import {useAtom, useAtomValue} from 'jotai'
import React, {useEffect} from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../../../images/chevronDownSvg'
import {
  baseFilterAtom,
  baseFilterDropdownDataAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {Dropdown, type DropdownItemProps} from '../../../../Dropdown'
import Image from '../../../../Image'
import checkmarkSvg from '../../../../images/checkmarkSvg'

function renderItem<T>(
  item: DropdownItemProps<T>,
  selected?: boolean | undefined
): React.ReactElement {
  return (
    <XStack ai="center" jc="space-between" py="$3" pl="$4" pr="$2">
      <Stack flexShrink={1}>
        <Text ff="$heading" fos={16} col={selected ? '$main' : '$white'}>
          {item.label}
        </Text>
      </Stack>
      {!!selected && (
        <Image
          source={checkmarkSvg}
          height={20}
          width={20}
          stroke={getTokens().color.main.val}
        />
      )}
    </XStack>
  )
}

interface Props {
  postSelectActions?: () => void
}

function BaseFilterDropdown({
  postSelectActions,
}: Props): React.ReactElement | null {
  const baseFilterDropdownData = useAtomValue(baseFilterDropdownDataAtom)
  const [baseFilter, setBaseFilter] = useAtom(baseFilterAtom)

  useEffect(() => {
    if (!baseFilter) {
      setBaseFilter('BTC_TO_CASH')
    }
  }, [baseFilter, setBaseFilter])

  if (!baseFilter) {
    return null
  }

  return (
    <Dropdown
      data={baseFilterDropdownData}
      value={baseFilter}
      onChange={(item) => {
        setBaseFilter(item.value)
        if (postSelectActions) postSelectActions()
      }}
      style={{}}
      containerStyle={{
        backgroundColor: getTokens().color.grey.val,
        borderRadius: getTokens().radius[4].val,
        borderWidth: 0,
      }}
      selectedTextStyle={{
        color: getTokens().color.main.val,
        fontSize: 100,
        fontFamily: 'PPMonument',
      }}
      renderRightIcon={() => (
        <Stack ml="$2">
          <Image source={chevronDownSvg} stroke={getTokens().color.main.val} />
        </Stack>
      )}
      renderItem={renderItem}
    />
  )
}

export default BaseFilterDropdown
