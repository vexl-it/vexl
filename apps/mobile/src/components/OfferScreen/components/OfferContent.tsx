import {type CreateOfferContentProps} from '../useContent'
import Section from './Section'
import React from 'react'
import {ActivityIndicator} from 'react-native'
import ChunkView from '../../ChunkView'
import {getTokens, Stack} from 'tamagui'

interface Props {
  content: CreateOfferContentProps[]
  editMode?: boolean
  offerActive?: boolean
}

function LoaderComponent(): JSX.Element {
  const tokens = getTokens()
  return (
    <Stack pt="$8">
      <ActivityIndicator size="large" color={tokens.color.main.val} />
    </Stack>
  )
}

function OfferContent({content}: Props): JSX.Element {
  return (
    <ChunkView displayOnProgress={<LoaderComponent />}>
      {content.map(
        (item) =>
          item.customSection ?? (
            <Section
              key={item.title}
              image={item.image}
              title={item.title}
              mandatory={item.mandatory}
            >
              {item.children}
            </Section>
          )
      )}
    </ChunkView>
  )
}

export default React.memo(OfferContent)
