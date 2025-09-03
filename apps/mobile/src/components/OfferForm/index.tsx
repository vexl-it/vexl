import React, {Fragment} from 'react'
import {getTokens, Stack} from 'tamagui'
import ChunkView from '../ChunkView'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'
import Section, {type Props} from '../Section'

function LoaderComponent(): React.ReactElement {
  const tokens = getTokens()
  return (
    <Stack pt="$8">
      <VexlActivityIndicator size="large" bc={tokens.color.main.val} />
    </Stack>
  )
}

function OfferForm({content}: {content: Props[]}): React.ReactElement {
  return (
    <ChunkView displayOnProgress={<LoaderComponent />}>
      {content.map((item) =>
        item.customSection ? (
          <Fragment key={item.title}>{item.children}</Fragment>
        ) : (
          <Section
            key={item.title}
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
