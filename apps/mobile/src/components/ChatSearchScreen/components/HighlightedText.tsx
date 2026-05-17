import {
  Typography,
  type TypographyProps,
  type TypographyVariant,
} from '@vexl-next/ui'
import React, {Fragment} from 'react'

function getHighlightedTextParts(
  text: string,
  query: string
): Array<{text: string; highlighted: boolean}> {
  const trimmedQuery = query.trim()

  if (trimmedQuery === '') return [{text, highlighted: false}]

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmedQuery.toLowerCase()
  const parts: Array<{text: string; highlighted: boolean}> = []

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

function HighlightedText({
  text,
  query,
  highlightColor = '$accentYellowPrimary',
  highlightVariant,
  ...props
}: {
  text: string
  query: string
  highlightColor?: TypographyProps['color']
  highlightVariant?: TypographyVariant
} & Omit<TypographyProps, 'children'>): React.ReactElement {
  const parts = getHighlightedTextParts(text, query)

  return (
    <Typography {...props}>
      {parts.map((part, index) => (
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
      ))}
    </Typography>
  )
}

export default HighlightedText
