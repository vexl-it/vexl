import React from 'react'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'

interface Props {
  children: JSX.Element | JSX.Element[]
  scrollable?: boolean
}

function Content({children, scrollable}: Props): JSX.Element {
  return (
    <Stack f={1} bc="$black">
      {scrollable ? (
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <Stack f={1}>{children}</Stack>
      )}
    </Stack>
  )
}

export default Content
