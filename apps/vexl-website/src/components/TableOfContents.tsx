'use client'

import {Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {type MarkdownHeading} from '../content/headings'
import {SiteLink} from './SiteLink'

export const MIN_TOC_HEADINGS = 2

export function TableOfContents({
  title,
  headings,
}: {
  readonly title: string
  readonly headings: readonly MarkdownHeading[]
}): React.JSX.Element {
  return (
    <YStack tag="nav" gap="$3">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        {title}
      </Typography>
      {headings.map((heading) => (
        <SiteLink key={heading.id} href={`#${heading.id}`}>
          <Typography
            variant="paragraphSmall"
            color="$foregroundPrimary"
            hoverStyle={{color: '$accentYellowPrimary'}}
          >
            {heading.text}
          </Typography>
        </SiteLink>
      ))}
    </YStack>
  )
}
