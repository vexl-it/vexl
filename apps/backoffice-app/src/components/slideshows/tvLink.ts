import {type ConfirmOptions} from '@/src/components/ui'
import {publicUrl, type PublicHosts} from '@/src/services/publicHosts'
import {
  getPublicIdentifier,
  type TvSlideshow,
} from '@/src/services/slideshows/domain'

export const tvUrl = (hosts: PublicHosts, slideshow: TvSlideshow): string =>
  publicUrl(hosts.slideshows, getPublicIdentifier(slideshow))

export const regenerateLinkConfirmation = (
  hosts: PublicHosts,
  slideshow: TvSlideshow
): ConfirmOptions => ({
  title: `Regenerate the link for “${slideshow.name}”?`,
  message: slideshow.publicSlug
    ? `${hosts.slideshows}/${slideshow.publicSlug} keeps working. TVs opened through the older token link stop playing until you open the new link on them.`
    : 'The current link stops working. Every TV showing this slideshow stops playing until you open the new link on it.',
  confirmLabel: 'Regenerate link',
})
