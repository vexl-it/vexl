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
}: {
  text: string
  onChange: (text: string) => void
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <TextInput
      multiline
      tag="textarea"
      verticalAlign="top"
      style={style.textInput}
      value={text}
      onChangeText={onChange}
      rows={5}
      variant="greyOnBlack"
      placeholder={t('offer.inputPlaceholder')}
      placeholderTextColor={getTokens().color.greyOnBlack.val}
    />
  )
}

export default OfferRequestTextInput
