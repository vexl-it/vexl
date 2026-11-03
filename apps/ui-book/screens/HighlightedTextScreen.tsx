import {HighlightedText, TextField, Typography, YStack} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const sampleText =
  'Selling bitcoin for cash in Prague. Bitcoin only, meet in person.'

const queryAtom = atom('bitcoin')

function Demos(): React.JSX.Element {
  const query = useAtomValue(queryAtom)

  return (
    <YStack gap="$4">
      <TextField valueAtom={queryAtom} placeholder="Query" showClear />
      <HighlightedText
        variant="paragraph"
        color="$foregroundPrimary"
        text={sampleText}
        query={query}
      />
      <Typography variant="description" color="$foregroundSecondary">
        Custom highlight color and variant
      </Typography>
      <HighlightedText
        variant="description"
        color="$foregroundSecondary"
        highlightColor="$pinkForeground"
        highlightVariant="descriptionBold"
        text={sampleText}
        query={query}
      />
      <Typography variant="description" color="$foregroundSecondary">
        No match
      </Typography>
      <HighlightedText
        variant="paragraph"
        color="$foregroundPrimary"
        text={sampleText}
        query="ethereum"
      />
    </YStack>
  )
}

export function HighlightedTextScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Highlighted Text" demos={Demos} />
}
