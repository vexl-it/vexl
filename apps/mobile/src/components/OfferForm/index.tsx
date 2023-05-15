import React from 'react'
import {ActivityIndicator} from 'react-native'
import {getTokens, Stack} from 'tamagui'
import Section, {type SectionProps} from '../Section'
import ChunkView from '../ChunkView'

interface Props {
  content: SectionProps[]
}

function LoaderComponent(): JSX.Element {
  const tokens = getTokens()
  return (
    <Stack pt="$8">
      <ActivityIndicator size="large" color={tokens.color.main.val} />
    </Stack>
  )
}

function OfferForm({content}: Props): JSX.Element {
  return (
    <ChunkView displayOnProgress={<LoaderComponent />}>
      {content.map((item) => (
        <Section
          key={item.title}
          customSection={item.customSection}
          image={item.image}
          title={item.title}
          mandatory={item.mandatory}
        >
          {item.children}
        </Section>
      ))}
    </ChunkView>
  )
}

export default React.memo(OfferForm)
