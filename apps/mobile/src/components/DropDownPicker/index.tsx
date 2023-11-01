import Image from '../Image'
import {Dropdown} from 'react-native-element-dropdown'
import chevronDownSvg from '../../images/chevronDownSvg'
import {getTokens, Text, XStack} from 'tamagui'
import {type DropdownProps} from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model'
import checkmarkSvg from '../images/checkmarkSvg'

export interface DropdownItemProps<T> {
  label: string
  value: T
}

function renderItem<T>(
  item: DropdownItemProps<T>,
  selected?: boolean | undefined
): JSX.Element {
  return (
    <XStack ai={'center'} jc={'space-between'} py={'$3'} px={'$4'}>
      <Text ff={'$body500'} fos={16} col={'$white'}>
        {item.label}
      </Text>
      {selected && (
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

export function DropdownPicker<T>(
  props: Omit<
    DropdownProps<DropdownItemProps<T>>,
    'labelField' | 'valueField' | 'renderItem'
  >
): JSX.Element {
  return (
    <Dropdown
      activeColor={getTokens().color.greyAccent1.val}
      labelField={'label'}
      valueField={'value'}
      style={{
        height: 48,
        backgroundColor: getTokens().color.grey.val,
        borderRadius: getTokens().radius[4].val,
        paddingHorizontal: 12,
      }}
      containerStyle={{
        backgroundColor: getTokens().color.grey.val,
        borderRadius: getTokens().radius[4].val,
        borderWidth: 0,
        height: 200,
      }}
      itemTextStyle={{
        color: getTokens().color.white.val,
        fontWeight: '500',
        fontSize: 16,
      }}
      selectedTextStyle={{
        color: getTokens().color.white.val,
        fontWeight: '500',
        fontSize: 16,
        fontFamily: 'TTSatoshi500',
      }}
      renderRightIcon={() => (
        <Image
          source={chevronDownSvg}
          stroke={getTokens().color.greyOnBlack.val}
        />
      )}
      renderItem={renderItem}
      {...props}
    />
  )
}
