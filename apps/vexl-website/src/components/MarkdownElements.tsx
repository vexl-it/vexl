'use client'

import {bodyFont, Divider, tokens, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

interface ElementProps {
  readonly children?: React.ReactNode
}

export function MdHeading({
  level,
  id,
  children,
}: ElementProps & {
  readonly level: 1 | 2 | 3 | 4 | 5 | 6
  readonly id?: string
}): React.JSX.Element {
  return (
    <Typography
      tag={`h${level}`}
      id={id}
      variant={
        level <= 2 ? 'heading3' : level <= 4 ? 'titles' : 'paragraphDemibold'
      }
      color="$foregroundPrimary"
      marginTop="$5"
      style={{scrollMarginTop: 96}}
    >
      {children}
    </Typography>
  )
}

export function MdParagraph({children}: ElementProps): React.JSX.Element {
  return (
    <Typography tag="p" variant="paragraph" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

export function MdLink({
  href = '#',
  children,
}: ElementProps & {readonly href?: string}): React.JSX.Element {
  const {path} = useLocale()
  return (
    <SiteLink href={href.startsWith('/') ? path(href) : href} inline>
      <Typography
        variant="paragraph"
        color="$foregroundPrimary"
        fontSize="inherit"
      >
        {children}
      </Typography>
    </SiteLink>
  )
}

export function MdList({
  ordered,
  start,
  children,
}: ElementProps & {
  readonly ordered: boolean
  readonly start?: number
}): React.JSX.Element {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space[2].val,
    margin: 0,
    paddingLeft: tokens.space[6].val,
  } satisfies React.CSSProperties
  return ordered ? (
    <ol start={start} style={style}>
      {children}
    </ol>
  ) : (
    <ul style={style}>{children}</ul>
  )
}

export function MdListItem({children}: ElementProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <li
      style={{
        color: theme.foregroundSecondary.get(),
        fontFamily: bodyFont.family,
      }}
    >
      <Typography variant="paragraph" color="$foregroundSecondary">
        {children}
      </Typography>
    </li>
  )
}

export function MdQuote({children}: ElementProps): React.JSX.Element {
  return (
    <YStack
      tag="blockquote"
      margin="$0"
      paddingLeft="$5"
      borderLeftWidth={3}
      borderColor="$accentYellowPrimary"
      gap="$3"
    >
      {children}
    </YStack>
  )
}

export function MdImage({
  src,
  alt = '',
}: {
  readonly src?: string
  readonly alt?: string
}): React.JSX.Element | null {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        borderRadius: 16,
      }}
    />
  )
}

export function MdRule(): React.JSX.Element {
  return <Divider />
}

export function MdBody({children}: ElementProps): React.JSX.Element {
  return <YStack gap="$4">{children}</YStack>
}
