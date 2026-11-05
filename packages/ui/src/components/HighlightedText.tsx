import {Array, pipe} from 'effect'
import React, {Fragment} from 'react'

import {
  Typography,
  type TypographyProps,
  type TypographyVariant,
} from './Typography'

interface TextPart {
  readonly text: string
  readonly highlighted: boolean
}

function splitByQuery(text: string, query: string): readonly TextPart[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') return [{text, highlighted: false}]

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmedQuery.toLowerCase()
  const parts: TextPart[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, currentIndex)

    if (matchIndex === -1) {
      parts.push({text: text.slice(currentIndex), highlighted: false})
      break
    }

    if (matchIndex > currentIndex) {
      parts.push({
        text: text.slice(currentIndex, matchIndex),
        highlighted: false,
      })
    }

    parts.push({
      text: text.slice(matchIndex, matchIndex + trimmedQuery.length),
      highlighted: true,
    })
    currentIndex = matchIndex + trimmedQuery.length
  }

  return parts
}

export interface HighlightedTextProps extends Omit<
  TypographyProps,
  'children'
> {
  readonly text: string
  readonly query: string
  readonly highlightColor?: TypographyProps['color']
  readonly highlightVariant?: TypographyVariant
}

export function HighlightedText({
  text,
  query,
  highlightColor = '$accentYellowPrimary',
  highlightVariant,
  ...props
}: HighlightedTextProps): React.JSX.Element {
  return (
    <Typography {...props}>
      {pipe(
        splitByQuery(text, query),
        Array.map((part, index) => (
          <Fragment key={`${part.text}-${index}`}>
            {part.highlighted ? (
              <Typography
                color={highlightColor}
                variant={highlightVariant ?? props.variant}
              >
                {part.text}
              </Typography>
            ) : (
              part.text
            )}
          </Fragment>
        ))
      )}
    </Typography>
  )
}
