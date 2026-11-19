import {Array, Option, pipe} from 'effect'
import {type BackofficeSection} from './domain'

export interface NavigationItem {
  readonly name: string
  readonly href: string
  readonly section: BackofficeSection
  readonly exact: boolean
}

export const NAVIGATION: readonly NavigationItem[] = [
  {name: 'Clubs List', href: '/clubs', section: 'clubs', exact: true},
  {name: 'Create Club', href: '/clubs/create', section: 'clubs', exact: true},
  {
    name: 'Generate Link',
    href: '/clubs/generate-link',
    section: 'clubs',
    exact: true,
  },
  {
    name: 'Product notification',
    href: '/product-notification',
    section: 'productNotifications',
    exact: false,
  },
  {
    name: 'TV slideshows',
    href: '/slideshows',
    section: 'slideshows',
    exact: false,
  },
  {
    name: 'Short links',
    href: '/short-links',
    section: 'shortLinks',
    exact: false,
  },
  {
    name: 'Banned numbers',
    href: '/banned-numbers',
    section: 'bannedNumbers',
    exact: false,
  },
  {name: 'Blog posts', href: '/blog-posts', section: 'cms', exact: false},
  {name: 'Events', href: '/events', section: 'cms', exact: false},
  {name: 'Admins', href: '/admins', section: 'admins', exact: false},
]

export const isCurrent = (item: NavigationItem, pathname: string): boolean =>
  item.exact ? pathname === item.href : pathname.startsWith(item.href)

export const permittedNavigation = (
  sections: readonly BackofficeSection[]
): readonly NavigationItem[] =>
  pipe(
    NAVIGATION,
    Array.filter((item) => Array.contains(sections, item.section))
  )

/** The first page the sections allow; `/` shows a no-access note otherwise. */
export const homePath = (sections: readonly BackofficeSection[]): string =>
  pipe(
    permittedNavigation(sections),
    Array.head,
    Option.match({onNone: () => '/', onSome: (item) => item.href})
  )
