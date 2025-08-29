import React from 'react'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'

interface Props {
  children: React.ReactElement | React.ReactElement[]
  scrollable?: boolean
}

function Content({children, scrollable}: Props): React.ReactElement {
  return (
    <Stack f={1} bc="$black" pb="$1">
      {scrollable ? (
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <Stack f={1}>{children}</Stack>
      )}
    </Stack>
  )
}

export default Content
