'use client'

import {
  CmsListPage,
  OpenLinkAction,
  type CmsColumn,
  type CmsView,
} from '@/src/components/cms/CmsListPage'
import {Badge, CheckIcon, FileTextIcon} from '@/src/components/ui'
import {
  blogPostPublicUrl,
  blogPostResource,
  isScheduled,
} from '@/src/services/cms/resources'
import {formatDate, formatDateTime} from '@/src/services/format'
import {type BlogPost} from '@vexl-next/domain/src/general/cms'
import {Option, Order} from 'effect'
import Link from 'next/link'

const COLUMNS: ReadonlyArray<CmsColumn<BlogPost>> = [
  {
    header: 'Post',
    order: Order.mapInput(Order.string, (post) => post.en.title.toLowerCase()),
    render: (post, editHref) => (
      <div className="flex w-64 items-center gap-3 sm:w-72 min-[1440px]:w-96 2xl:w-[30rem]">
        {Option.match(post.imageUrl, {
          onNone: () => (
            <div className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-control bg-canvas text-ink-subtle">
              <FileTextIcon />
            </div>
          ),
          onSome: (imageUrl) => (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="h-11 w-[4.5rem] shrink-0 rounded-control bg-canvas object-cover"
            />
          ),
        })}
        <div className="min-w-0">
          <Link
            href={editHref}
            className="line-clamp-2 font-medium text-ink hover:underline"
          >
            {post.en.title}
          </Link>
          <div className="mt-0.5 flex items-center gap-2">
            {post.featured ? <Badge tone="accent">Featured</Badge> : null}
            <span className="truncate font-mono text-xs text-ink-subtle">
              /{post.slug}
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    header: 'Languages',
    render: (post) => (
      <div className="flex gap-1">
        <Badge tone="success">
          <CheckIcon className="size-3" />
          EN
        </Badge>
        {Option.isSome(post.cs) ? (
          <Badge tone="success">
            <CheckIcon className="size-3" />
            CS
          </Badge>
        ) : (
          <Badge>No CS</Badge>
        )}
      </div>
    ),
  },
  {
    header: 'Publish date',
    order: Order.mapInput(Order.Date, (post) => post.publishedAt),
    render: (post) => (
      <div className="whitespace-nowrap">
        <div title={formatDateTime(post.publishedAt)}>
          {formatDate(post.publishedAt)}
        </div>
        <div
          className="mt-0.5 text-xs text-ink-subtle"
          title={formatDateTime(post.createdAt)}
        >
          created {formatDate(post.createdAt)}
        </div>
      </div>
    ),
  },
]

const VIEWS: ReadonlyArray<CmsView<BlogPost>> = [
  {label: 'Featured', matches: (post) => post.featured},
  {label: 'English only', matches: (post) => Option.isNone(post.cs)},
]

export default function BlogPostsPage() {
  return (
    <CmsListPage
      resource={blogPostResource}
      title="Blog posts"
      description="Articles on the Vexl website and in the app. Drafts stay here until you publish them."
      columns={COLUMNS}
      views={VIEWS}
      defaultSort={{key: 'Publish date', descending: true}}
      rowAction={(post) =>
        post.status === 'published' &&
        !isScheduled(post.status, post.publishedAt) ? (
          <OpenLinkAction
            href={blogPostPublicUrl(post.slug)}
            label="Open on the website"
          />
        ) : null
      }
    />
  )
}
