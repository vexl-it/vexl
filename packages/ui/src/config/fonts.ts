import {createFont} from 'tamagui'

// Typography from Figma — Vexl redesign DEV (node 593:39715)
//
// Body font: TT Satoshi (Medium 500, DemiBold 600)
// Heading font: Monument Extended (Regular 400, Bold 700)
//
// Size keys map to Figma styles:
//   Body:    1=Micro 2=Description 3=ParagraphSmall 4=Paragraph 5=TitlesSmall 6=Titles 7=PresBody
//   Heading: 1=TabSmall 2=TabLarge 3=Heading3 4=GraphPrice 5=Heading2 6=Heading1

export const bodyFont = createFont({
  family: 'TTSatoshi',
  size: {
    1: 12, // Micro
    2: 14, // Description / Description Bold
    3: 16, // Paragraph Small / Paragraph Small Bold
    4: 18, // Paragraph / Paragraf Demibold
    5: 20, // Titles Small
    6: 24, // Titles
    7: 40, // pres body
    true: 18,
  },
  lineHeight: {
    1: 17,
    2: 20,
    3: 22,
    4: 24,
    5: 28,
    6: 34,
    7: 52,
    true: 24,
  },
  weight: {
    5: '500', // Medium
    6: '600', // DemiBold
  },
  letterSpacing: {
    1: -0.36, // Micro: -3%
    2: -0.28, // Description: -2%
    3: -0.64, // Paragraph Small: -4%
    4: 0, // Paragraph: 0%
    5: -0.4, // Titles Small: -2%
    6: -0.48, // Titles: -2%
    7: -0.8, // pres body: -2%
    true: 0,
  },
  face: {
    400: {normal: 'TTSatoshi400'},
    500: {normal: 'TTSatoshi500'},
    600: {normal: 'TTSatoshi600'},
    700: {normal: 'TTSatoshi700'},
  },
})

export const headingFont = createFont({
  family: 'MonumentExtended',
  size: {
    1: 14, // Tab Small / Tab Small Bold
    2: 18, // Tab Large / Tab Large Bold
    3: 24, // Heading 3
    4: 28, // Graph Price
    5: 32, // Heading 2
    6: 40, // Heading 1
    true: 24,
  },
  lineHeight: {
    1: 20,
    2: 25,
    3: 28, // Figma: 28px
    4: 28, // Figma: 28px
    5: 40, // Figma: 40px
    6: 52, // Figma: 130%
    true: 28,
  },
  weight: {
    4: '400', // Regular
    7: '700', // Bold
  },
  letterSpacing: {
    1: -0.56, // Tab Small: -4%
    2: -0.36, // Tab Large: -2%
    3: -1, // Heading 3: -1px
    4: -1, // Graph Price: -1px
    5: -1, // Heading 2: -1px
    6: -1, // Heading 1: -1px
    true: -1,
  },
  face: {
    400: {normal: 'PPMonument700'},
    700: {normal: 'PPMonument700'},
  },
})
