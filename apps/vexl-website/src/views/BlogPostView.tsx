'use client'

import {DotSeparatedRow, PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {BottomCta} from '../components/BottomCta'
import {EnglishOnlyNote} from '../components/EnglishOnlyNote'
import {useLocale} from '../components/LocaleProvider'
import {SiteLink} from '../components/SiteLink'
import {MIN_TOC_HEADINGS, TableOfContents} from '../components/TableOfContents'
import {type BlogPostSummary} from '../content/blogSummary'
import {type MarkdownHeading} from '../content/headings'
import {formatDate} from '../formatDate'
import {formatMessage} from '../i18n/locales'
import {BlogPostGrid} from './BlogView'

export function BlogPostView({
  post,
  headings,
  related,
  body,
}: {
  readonly post: BlogPostSummary
  readonly headings: readonly MarkdownHeading[]
  readonly related: readonly BlogPostSummary[]
  readonly body: React.ReactNode
}): React.JSX.Element {
  const {t, locale, path} = useLocale()
  return (
    <>
      <PageSection maxWidth={800} gap="$5">
        <SiteLink href={path('/blog')}>
          <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
            {t.blog.back}
          </Typography>
        </SiteLink>
        <Typography tag="h1" variant="heading1" color="$foregroundPrimary">
          {post.title}
        </Typography>
        <DotSeparatedRow flexWrap="wrap">
          <Typography variant="description" color="$foregroundSecondary">
            {formatMessage(t.blog.publishedBy, {author: post.author})}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {formatDate(locale, post.date)}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {formatMessage(t.blog.readingTime, {minutes: post.readingMinutes})}
          </Typography>
        </DotSeparatedRow>
        {post.image ? (
          <YStack borderRadius="$5" overflow="hidden">
            <Image
              src={post.image}
              alt=""
              width={1600}
              height={960}
              priority
              sizes="(min-width: 800px) 720px, 100vw"
              style={{width: '100%', height: 'auto'}}
            />
          </YStack>
        ) : null}
        {headings.length >= MIN_TOC_HEADINGS ? (
          <YStack
            padding="$5"
            borderRadius="$5"
            backgroundColor="$backgroundSecondary"
          >
            <TableOfContents
              title={t.blog.tableOfContents}
              headings={headings}
            />
          </YStack>
        ) : null}
        <EnglishOnlyNote text={t.blog.englishOnly} />
        {body}
      </PageSection>
      {related.length > 0 ? (
        <PageSection>
          <Typography tag="h2" variant="heading2" color="$foregroundPrimary">
            {t.blog.related}
          </Typography>
          <BlogPostGrid posts={related} />
        </PageSection>
      ) : null}
      <BottomCta />
    </>
  )
}
