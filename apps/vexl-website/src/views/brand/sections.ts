import {Array, pipe} from 'effect'

export const brandSections = [
  'logos',
  'colors',
  'typography',
  'branding-samples',
  'application-examples',
  'people',
  'press-kit',
  'vexl-journey',
  'help',
] as const

export type BrandSection = (typeof brandSections)[number]

export const isBrandSection = (value: string): value is BrandSection =>
  pipe(
    brandSections,
    Array.some((section) => section === value)
  )

export const brandPath = (section?: BrandSection): string =>
  section === undefined ? '/brand' : `/brand/${section}`

/** Brand files live under `public/wf/brand`. */
export const brandAsset = (file: string): string => `/wf/brand/${file}`

/** The card colors the website's own cards use, in the order the hub shows them. */
export const cardTones = ['yellow', 'green', 'pink', 'dark'] as const
export type CardTone = (typeof cardTones)[number]
