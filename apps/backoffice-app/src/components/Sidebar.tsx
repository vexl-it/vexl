'use client'

import {
  BanIcon,
  BellIcon,
  CalendarIcon,
  cx,
  FileTextIcon,
  LinkIcon,
  LogOutIcon,
  ShieldIcon,
  TvIcon,
  UsersIcon,
  VexlLogo,
  type Icon,
} from '@/src/components/ui'
import {type BackofficeSession} from '@/src/services/access/domain'
import {
  isCurrent,
  permittedNavigation,
  type NavigationItem,
  type NavigationItemId,
} from '@/src/services/access/navigation'
import {Array} from 'effect'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

const NAV_ICONS: Record<NavigationItemId, Icon> = {
  clubs: UsersIcon,
  bannedNumbers: BanIcon,
  blogPosts: FileTextIcon,
  events: CalendarIcon,
  slideshows: TvIcon,
  productNotifications: BellIcon,
  shortLinks: LinkIcon,
  admins: ShieldIcon,
}

export function Brand() {
  return (
    <div className="flex items-center gap-2.5 text-sidebar-ink-strong">
      <VexlLogo className="h-5 w-auto" />
      <span className="rounded-[10px_2px] bg-accent px-2 py-0.5 font-display text-[10px] leading-4 tracking-[-0.02em]">
        Backoffice
      </span>
    </div>
  )
}

function NavLink({
  item,
  current,
  onNavigate,
}: {
  readonly item: NavigationItem
  readonly current: boolean
  readonly onNavigate: () => void
}) {
  const ItemIcon = NAV_ICONS[item.id]
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
      className={cx(
        'group flex items-center gap-3 rounded-full px-3.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-focus',
        current
          ? 'bg-sidebar-active font-semibold text-sidebar-ink-strong'
          : 'font-medium text-sidebar-ink hover:bg-sidebar-hover hover:text-sidebar-ink-strong'
      )}
    >
      <ItemIcon
        className={cx(
          'size-4',
          current
            ? 'text-sidebar-ink-strong'
            : 'text-sidebar-ink-subtle group-hover:text-sidebar-ink-strong'
        )}
      />
      {item.name}
    </Link>
  )
}

export function Sidebar({
  session,
  onNavigate,
  onSignOut,
}: {
  readonly session: BackofficeSession
  readonly onNavigate: () => void
  readonly onSignOut: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r border-sidebar-line bg-sidebar">
      <div className="flex h-14 shrink-0 items-center px-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {Array.map(permittedNavigation(session.sections), (group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-ink-subtle">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {Array.map(group.items, (item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  current={isCurrent(item, pathname)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-sidebar-line p-3">
        <div className="px-3.5 pb-2">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-ink-subtle">
            Signed in as
          </p>
          <p
            className="truncate text-sm text-sidebar-ink-strong"
            title={session.label}
          >
            {session.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full cursor-pointer items-center gap-3 rounded-full px-3.5 py-2 text-sm font-medium text-sidebar-ink transition-colors hover:bg-sidebar-hover hover:text-sidebar-ink-strong focus-visible:outline-2 focus-visible:outline-focus"
        >
          <LogOutIcon className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
