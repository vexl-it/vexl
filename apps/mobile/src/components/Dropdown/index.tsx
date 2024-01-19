import Image from '../Image'
import {Dropdown as RNEDropdown} from 'react-native-element-dropdown'
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
    <XStack ai="center" jc="space-between" py="$3" pl="$4" pr="$2">
      <Text ff="$body500" fos={16} col="$white">
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

interface Props<T>
  extends Omit<
    DropdownProps<DropdownItemProps<T>>,
    'labelField' | 'valueField' | 'renderItem'
  > {
  size?: 'medium' | 'large'
  variant?: 'yellow' | 'grey'
}

export function Dropdown<T>({
  size = 'medium',
  variant = 'grey',
  ...props
}: Props<T>): JSX.Element {
  return (
    <RNEDropdown
      activeColor={getTokens().color.greyAccent1.val}
      labelField="label"
      valueField="value"
      showsVerticalScrollIndicator={false}
      style={{
        height: size === 'large' ? 56 : 48,
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
      itemContainerStyle={{
        borderRadius: getTokens().radius[4].val,
      }}
      itemTextStyle={{
        color: getTokens().color.white.val,
        fontWeight: '500',
        fontSize: size === 'large' ? 18 : 16,
      }}
      selectedTextProps={{numberOfLines: 2, adjustsFontSizeToFit: true}}
      selectedTextStyle={{
        color:
          variant === 'yellow'
            ? getTokens().color.main.val
            : getTokens().color.white.val,
        fontWeight: '500',
        fontSize: size === 'large' ? 18 : 16,
        fontFamily: 'TTSatoshi500',
      }}
      placeholderStyle={{
        fontSize: 18,
        fontWeight: '500',
        color: getTokens().color.greyOnBlack.val,
      }}
      renderRightIcon={() =>
        !props.disable ? (
          <Image
            source={chevronDownSvg}
            stroke={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <></>
        )
      }
      renderItem={renderItem}
      {...props}
    />
  )
}
