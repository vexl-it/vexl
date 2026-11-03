import {HighlightedText, TextField} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const sampleText =
  'Selling bitcoin for cash in Prague. Bitcoin only, meet in person.'

const queryAtom = atom('bitcoin')

function Demos(): React.JSX.Element {
  const query = useAtomValue(queryAtom)

  return (
    <>
      <TextField valueAtom={queryAtom} placeholder="Query" showClear />
      <DemoSection title="Default">
        <HighlightedText
          variant="paragraph"
          color="$foregroundPrimary"
          text={sampleText}
          query={query}
        />
      </DemoSection>
      <DemoSection title="Custom highlight color and variant">
        <HighlightedText
          variant="description"
          color="$foregroundSecondary"
          highlightColor="$pinkForeground"
          highlightVariant="descriptionBold"
          text={sampleText}
          query={query}
        />
      </DemoSection>
      <DemoSection title="No match">
        <HighlightedText
          variant="paragraph"
          color="$foregroundPrimary"
          text={sampleText}
          query="ethereum"
        />
      </DemoSection>
    </>
  )
}

export function HighlightedTextScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Highlighted Text" demos={Demos} />
}
