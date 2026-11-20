import {Array, Option, pipe} from 'effect'
import {type BackofficeSection} from './domain'

export type NavigationItemId =
  | 'clubs'
  | 'bannedNumbers'
  | 'blogPosts'
  | 'events'
  | 'slideshows'
  | 'productNotifications'
  | 'shortLinks'
  | 'admins'

export interface NavigationItem {
  readonly id: NavigationItemId
  readonly name: string
  readonly href: string
  readonly section: BackofficeSection
}

export interface NavigationGroup {
  readonly title: string
  readonly items: readonly NavigationItem[]
}

export const NAVIGATION: readonly NavigationGroup[] = [
  {
    title: 'Community',
    items: [
      {id: 'clubs', name: 'Clubs', href: '/clubs', section: 'clubs'},
      {
        id: 'bannedNumbers',
        name: 'Banned numbers',
        href: '/banned-numbers',
        section: 'bannedNumbers',
      },
    ],
  },
  {
    title: 'Content',
    items: [
      {
        id: 'blogPosts',
        name: 'Blog posts',
        href: '/blog-posts',
        section: 'cms',
      },
      {id: 'events', name: 'Events', href: '/events', section: 'cms'},
      {
        id: 'slideshows',
        name: 'TV slideshows',
        href: '/slideshows',
        section: 'slideshows',
      },
    ],
  },
  {
    title: 'Outreach',
    items: [
      {
        id: 'productNotifications',
        name: 'Product notifications',
        href: '/product-notification',
        section: 'productNotifications',
      },
      {
        id: 'shortLinks',
        name: 'Short links',
        href: '/short-links',
        section: 'shortLinks',
      },
    ],
  },
  {
    title: 'Access',
    items: [{id: 'admins', name: 'Admins', href: '/admins', section: 'admins'}],
  },
]

export const isCurrent = (item: NavigationItem, pathname: string): boolean =>
  pathname === item.href || pathname.startsWith(`${item.href}/`)

/** Groups with only the items the sections allow; empty groups are dropped. */
export const permittedNavigation = (
  sections: readonly BackofficeSection[]
): readonly NavigationGroup[] =>
  pipe(
    NAVIGATION,
    Array.map((group) => ({
      ...group,
      items: Array.filter(group.items, (item) =>
        Array.contains(sections, item.section)
      ),
    })),
    Array.filter((group) => Array.isNonEmptyReadonlyArray(group.items))
  )

/** The first page the sections allow; `/` shows a no-access note otherwise. */
export const homePath = (sections: readonly BackofficeSection[]): string =>
  pipe(
    permittedNavigation(sections),
    Array.flatMap((group) => group.items),
    Array.head,
    Option.match({onNone: () => '/', onSome: (item) => item.href})
  )
