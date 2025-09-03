import React from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, Text} from 'tamagui'

interface Props {
  text: string
  placeholder?: string
  onPress?: () => void
}

function MockedTouchableTextInput({
  text,
  placeholder,
  onPress,
}: Props): React.ReactElement {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Stack br="$4" f={1} bc="$grey" p="$4">
        {text ? (
          <Text fos={18} color="$main">
            {text}
          </Text>
        ) : (
          <Text ff="$body600" fos={18} color="$greyOnBlack">
            {placeholder}
          </Text>
        )}
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default MockedTouchableTextInput
