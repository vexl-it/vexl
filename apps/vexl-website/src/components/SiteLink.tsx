'use client'

import NextLink from 'next/link'
import React from 'react'

const isExternal = (href: string): boolean =>
  !href.startsWith('/') && !href.startsWith('#')

export interface SiteLinkProps {
  readonly href: string
  readonly children: React.ReactNode
  readonly label?: string
  /** Inline links flow inside text; block links wrap cards and buttons. */
  readonly inline?: boolean
  readonly fill?: boolean
  readonly current?: boolean
  readonly onPress?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

export function SiteLink({
  href,
  children,
  label,
  inline = false,
  fill = false,
  current = false,
  onPress,
}: SiteLinkProps): React.JSX.Element {
  const external = isExternal(href)
  return (
    <NextLink
      href={href}
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      onClick={onPress}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      prefetch={false}
      style={{
        color: 'inherit',
        textDecoration: inline ? 'underline' : 'none',
        display: inline ? 'inline' : 'flex',
        flexDirection: 'column',
        // a 0% basis shares row space evenly but sizes to content in a column
        flex: fill ? '1 1 0%' : undefined,
      }}
    >
      {children}
    </NextLink>
  )
}
