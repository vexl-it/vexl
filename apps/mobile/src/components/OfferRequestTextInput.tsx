import {getTokens} from 'tamagui'
import TextInput from './Input'
import React from 'react'
import {StyleSheet} from 'react-native'
import {useTranslation} from '../utils/localization/I18nProvider'

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
}): JSX.Element {
  const {t} = useTranslation()

  return (
    <TextInput
      style={style.textInput}
      value={text}
      onChangeText={onChange}
      multiline
      numberOfLines={5}
      variant={'greyOnBlack'}
      placeholder={t('offer.inputPlaceholder')}
      placeholderTextColor={getTokens().color.greyOnBlack.val}
    />
  )
}

export default OfferRequestTextInput
