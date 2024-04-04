import {StyleSheet} from 'react-native'
import {getTokens} from 'tamagui'

export const dropdownStyles = StyleSheet.create({
  dropdown: {
    width: 65,
  },
  dropdownContainerStyle: {
    backgroundColor: getTokens().color.greyAccent1.val,
    borderRadius: getTokens().radius[4].val,
    width: 100,
    borderWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dropdownItemContainerStyle: {
    borderRadius: getTokens().radius[4].val,
  },
  selectedTextStyle: {
    color: getTokens().color.white.val,
    fontWeight: '500',
    fontSize: 18,
    fontFamily: 'TTSatoshi500',
  },
})
