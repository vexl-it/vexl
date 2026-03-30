import React, {Fragment} from 'react'
import {Text, type TextProps} from 'tamagui'

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
  ...props
}: {
  text: string
  query: string
  highlightColor?: TextProps['color']
} & TextProps): React.ReactElement {
  const parts = getHighlightedTextParts(text, query)

  return (
    <Text {...props}>
      {parts.map((part, index) => (
        <Fragment key={`${part.text}-${index}`}>
          {part.highlighted ? (
            <Text color={highlightColor} ff="$body600">
              {part.text}
            </Text>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </Text>
  )
}

export default HighlightedText
