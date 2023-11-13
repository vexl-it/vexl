import {Stack} from 'tamagui'
import {ScrollView} from 'react-native'
import React from 'react'

interface Props {
  children: JSX.Element | JSX.Element[]
  scrollable?: boolean
}

function Content({children, scrollable}: Props): JSX.Element {
  return (
    <Stack f={1} bc={'$black'}>
      {scrollable ? (
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <Stack f={1}>{children}</Stack>
      )}
    </Stack>
  )
}

export default Content
