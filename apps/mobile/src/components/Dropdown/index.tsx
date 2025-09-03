import React from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Dropdown as RNEDropdown} from 'react-native-element-dropdown'
import {type DropdownProps} from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import chevronDownSvg from '../../images/chevronDownSvg'
import Image from '../Image'
import checkmarkSvg from '../images/checkmarkSvg'
import closeSvg from '../images/closeSvg'

export interface DropdownItemProps<T> {
  label: string
  value: T
}

function renderItem<T>(
  item: DropdownItemProps<T>,
  selected?: boolean | undefined
): React.ReactElement {
  return (
    <XStack ai="center" jc="space-between" py="$3" pl="$4" pr="$2">
      <Text ff="$body500" fos={16} col="$white">
        {item.label}
      </Text>
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

interface Props<T>
  extends Omit<
    DropdownProps<DropdownItemProps<T>>,
    'labelField' | 'valueField'
  > {
  size?: 'small' | 'medium' | 'large'
  variant?: 'yellow' | 'grey'
  onClear?: () => void
  showClearButton?: boolean
}

export function Dropdown<T>({
  size = 'medium',
  variant = 'grey',
  value,
  onClear,
  showClearButton,
  ...props
}: Props<T>): React.ReactElement {
  return (
    <RNEDropdown
      activeColor={getTokens().color.greyAccent1.val}
      labelField="label"
      valueField="value"
      showsVerticalScrollIndicator={false}
      style={{
        height: size === 'large' ? 56 : size === 'medium' ? 48 : 32,
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
        fontSize: size === 'large' ? 18 : size === 'medium' ? 16 : 14,
      }}
      selectedTextProps={{numberOfLines: 2, adjustsFontSizeToFit: true}}
      selectedTextStyle={{
        color:
          variant === 'yellow'
            ? getTokens().color.main.val
            : getTokens().color.white.val,
        fontWeight: '500',
        fontSize: size === 'large' ? 18 : size === 'medium' ? 16 : 14,
        fontFamily: 'TTSatoshi500',
      }}
      placeholderStyle={{
        fontSize: 18,
        fontWeight: '500',
        color: getTokens().color.greyOnBlack.val,
      }}
      renderRightIcon={() =>
        !props.disable ? (
          <XStack ai="center" gap="$2">
            {typeof value !== 'string' && value?.value && showClearButton ? (
              <TouchableWithoutFeedback onPress={onClear} hitSlop={5}>
                <Stack>
                  <Image
                    source={closeSvg}
                    stroke={getTokens().color.greyOnBlack.val}
                  />
                </Stack>
              </TouchableWithoutFeedback>
            ) : (
              <Image
                source={chevronDownSvg}
                stroke={getTokens().color.greyOnBlack.val}
              />
            )}
          </XStack>
        ) : (
          <></>
        )
      }
      renderItem={renderItem}
      value={value}
      {...props}
    />
  )
}
