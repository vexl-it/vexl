import React from 'react'
import {StyleSheet} from 'react-native'
import {getTokens} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import TextInput from './Input'

const style = StyleSheet.create({
  textInput: {
    minHeight: 130,
    alignItems: 'flex-start',
  },
})

function OfferRequestTextInput({
  text,
  onChange,
  placeholder,
}: {
  text: string
  onChange: (text: string) => void
  placeholder?: string
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <TextInput
      py="$4"
      multiline
      tag="textarea"
      verticalAlign="top"
      style={style.textInput}
      value={text}
      onChangeText={onChange}
      rows={5}
      variant="greyOnBlack"
      placeholder={placeholder ?? t('offer.inputPlaceholder')}
      placeholderTextColor={getTokens().color.greyOnBlack.val}
    />
  )
}

export default OfferRequestTextInput
