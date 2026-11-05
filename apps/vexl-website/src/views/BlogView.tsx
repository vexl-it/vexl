'use client'

import {BlogCard, PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'
import {SiteLink} from '../components/SiteLink'
import {type BlogPostSummary} from '../content/blogSummary'
import {formatDate} from '../formatDate'

export function BlogPostGrid({
  posts,
}: {
  readonly posts: readonly BlogPostSummary[]
}): React.JSX.Element {
  const {locale, path} = useLocale()
  return (
    <YStack gap="$5" $md={{flexDirection: 'row', flexWrap: 'wrap'}}>
      {posts.map((post) => (
        <YStack
          key={post.slug}
          $md={{width: 'calc((100% - 16px) / 2)'}}
          $lg={{width: 'calc((100% - 32px) / 3)'}}
        >
          <SiteLink href={path(`/post/${post.slug}`)}>
            <BlogCard
              imageUri={post.image}
              title={post.title}
              description={post.summary}
              date={formatDate(locale, post.date)}
            />
          </SiteLink>
        </YStack>
      ))}
    </YStack>
  )
}

function FeaturedPost({
  post,
}: {
  readonly post: BlogPostSummary
}): React.JSX.Element {
  const {locale, path} = useLocale()
  return (
    <SiteLink href={path(`/post/${post.slug}`)}>
      <YStack
        role="none"
        gap="$5"
        padding="$4"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        hoverStyle={{backgroundColor: '$backgroundTertiary'}}
        $md={{flexDirection: 'row', alignItems: 'center'}}
      >
        {post.image ? (
          <YStack flex={1} borderRadius="$5" overflow="hidden">
            <Image
              src={post.image}
              alt=""
              width={1200}
              height={720}
              sizes="(min-width: 768px) 560px, 100vw"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '5 / 3',
                objectFit: 'cover',
              }}
            />
          </YStack>
        ) : null}
        <YStack flex={1} gap="$4" padding="$4">
          <Typography tag="h2" variant="heading3" color="$foregroundPrimary">
            {post.title}
          </Typography>
          <Typography
            variant="paragraphSmall"
            color="$foregroundSecondary"
            numberOfLines={3}
          >
            {post.summary}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {formatDate(locale, post.date)}
          </Typography>
        </YStack>
      </YStack>
    </SiteLink>
  )
}

export function BlogView({
  featured,
  posts,
}: {
  readonly featured: BlogPostSummary | undefined
  readonly posts: readonly BlogPostSummary[]
}): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection>
      <PageHero title={t.blog.title} text={t.blog.text} />
      {featured ? <FeaturedPost post={featured} /> : null}
      <BlogPostGrid posts={posts} />
    </PageSection>
  )
}
