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
    400: {normal: 'PPMonument400'},
    700: {normal: 'PPMonument700'},
  },
})

// Semantic typography styles.
// These start from the Figma spec, but heading-like variants use practical
// multiline-safe line heights instead of strict 100% / auto values.
export const typographyVariantStyles = {
  heading1: {
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '400',
    lineHeight: 52,
    letterSpacing: -1,
  },
  presBody: {
    fontFamily: '$body',
    fontSize: '$7',
    fontWeight: '500',
    lineHeight: 52,
    letterSpacing: -0.8,
  },
  heading2: {
    fontFamily: '$heading',
    fontSize: '$5',
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: -1,
  },
  graphPrice: {
    fontFamily: '$heading',
    fontSize: '$4',
    fontWeight: '400',
    lineHeight: 34,
    letterSpacing: -1,
  },
  heading3: {
    fontFamily: '$heading',
    fontSize: '$3',
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: -1,
  },
  titles: {
    fontFamily: '$body',
    fontSize: '$6',
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: -0.48,
  },
  titlesSmall: {
    fontFamily: '$body',
    fontSize: '$5',
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  paragraph: {
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  paragraphDemibold: {
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.36,
  },
  tabLarge: {
    fontFamily: '$heading',
    fontSize: '$2',
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.36,
  },
  tabLargeBold: {
    fontFamily: '$heading',
    fontSize: '$2',
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.36,
  },
  paragraphSmallBold: {
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.64,
  },
  paragraphSmall: {
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: -0.64,
  },
  descriptionBold: {
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: -0.42,
  },
  description: {
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: -0.28,
  },
  tabSmallBold: {
    fontFamily: '$heading',
    fontSize: '$1',
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.56,
  },
  tabSmall: {
    fontFamily: '$heading',
    fontSize: '$1',
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.56,
  },
  micro: {
    fontFamily: '$body',
    fontSize: '$1',
    fontWeight: '500',
    lineHeight: 12,
    letterSpacing: -0.36,
  },
} as const

export type TypographyVariant = keyof typeof typographyVariantStyles
