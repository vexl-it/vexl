import React from 'react'
import {ActivityIndicator} from 'react-native'
import {getTokens, Stack} from 'tamagui'
import Section, {type Props} from '../Section'
import ChunkView from '../ChunkView'

function LoaderComponent(): JSX.Element {
  const tokens = getTokens()
  return (
    <Stack pt="$8">
      <ActivityIndicator size="large" color={tokens.color.main.val} />
    </Stack>
  )
}

function OfferForm({content}: {content: Props[]}): JSX.Element {
  return (
    <ChunkView displayOnProgress={<LoaderComponent />}>
      {content.map((item) =>
        item.customSection ? (
          <Section
            key={item.title}
            customSection={item.customSection}
            mandatory={item.mandatory}
            title={item.title}
          >
            {item.children}
          </Section>
        ) : (
          <Section
            key={item.title}
            customSection={item.customSection}
            image={item.image}
            imageFill={item.imageFill}
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

export default React.memo(OfferForm)
