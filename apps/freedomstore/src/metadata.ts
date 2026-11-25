import {type Metadata} from 'next'

export const SITE_URL = 'https://freedomstore.io'
const DEFAULT_OG_IMAGE = '/wf/685014a7e841829eb625ce0f_OG_image.avif'

/** Title, description, icons and social cards, as Webflow sets them. */
export function pageMetadata({
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
}: {
  readonly path: string
  readonly title: string
  readonly description?: string
  readonly image?: string
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    icons: {
      icon: '/wf/6850152381865a223d26e10b_Frame_2147209097.png',
      apple: '/wf/685016d8655f6879466b2093_Frame_2147209098.png',
    },
    alternates: {
      canonical: path,
    },
    openGraph: {title, description, images: [image], type: 'website'},
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
