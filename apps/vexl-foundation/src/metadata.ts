import {type Metadata} from 'next'

export const SITE_URL = 'https://vexl.foundation'
const DEFAULT_OG_IMAGE = '/wf/647c6ba3159f326b0305d81b_Preview.jpg'

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
      icon: '/wf/647c6b8931f6a51a295c0df1_Favicon.jpg',
      apple: '/wf/647c6ba3159f326b0305d81b_Preview.jpg',
    },
    alternates: {
      canonical: path,
    },
    openGraph: {title, description, images: [image], type: 'website'},
    twitter: {card: 'summary_large_image', title, description},
  }
}
