import {Typography, type TypographyVariant} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const variantLabels = {
  display: 'Display',
  heading1: 'Heading 1',
  presBody: 'Pres Body',
  heading2: 'Heading 2',
  graphPrice: 'Graph Price',
  heading3: 'Heading 3',
  titles: 'Titles',
  titlesSmall: 'Titles Small',
  paragraph: 'Paragraph',
  paragraphDemibold: 'Paragraph Demibold',
  tabLarge: 'Tab Large',
  tabLargeBold: 'Tab Large Bold',
  paragraphSmallBold: 'Paragraph Small Bold',
  paragraphSmall: 'Paragraph Small',
  descriptionBold: 'Description Bold',
  description: 'Description',
  tabSmallBold: 'Tab Small Bold',
  tabSmall: 'Tab Small',
  micro: 'Micro',
} satisfies Record<TypographyVariant, string>

function isTypographyVariant(key: string): key is TypographyVariant {
  return key in variantLabels
}

const variants = Object.keys(variantLabels).filter(isTypographyVariant)

function Demos(): React.JSX.Element {
  return (
    <>
      {variants.map((variant) => (
        <Typography key={variant} variant={variant} color="$foregroundPrimary">
          {variantLabels[variant]}
        </Typography>
      ))}
    </>
  )
}

export function TypographyScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Typography" demos={Demos} />
}
