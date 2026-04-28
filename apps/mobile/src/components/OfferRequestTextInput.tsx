import {TextArea, tokens} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'

const textAreaMinHeight =
  tokens.size[13].val + tokens.size[10].val + tokens.size[1].val

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
    <TextArea
      minHeight={textAreaMinHeight}
      backgroundColor="$backgroundTertiary"
      borderRadius="$5"
      padding="$4"
      multiline
      verticalAlign="top"
      value={text}
      onChangeText={onChange}
      borderWidth={0}
      color="$foregroundPrimary"
      fontFamily="$body"
      fontSize="$4"
      fontWeight="500"
      lineHeight={24}
      placeholder={placeholder ?? t('offer.inputPlaceholder')}
      placeholderTextColor="$foregroundSecondary"
    />
  )
}

export default OfferRequestTextInput
