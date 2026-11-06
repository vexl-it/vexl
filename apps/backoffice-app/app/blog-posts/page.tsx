'use client'

import {CmsListPage} from '@/src/components/cms/CmsListPage'
import {formatDateTime} from '@/src/services/cms/dateTimeLocal'
import {blogPostResource} from '@/src/services/cms/resources'
import {Option} from 'effect'

export default function BlogPostsPage() {
  return (
    <CmsListPage
      resource={blogPostResource}
      title="Blog posts"
      newLabel="New blog post"
      publishFromList={false}
      itemName={(post) => post.en.title}
      columns={[
        {
          header: 'Title',
          render: (post) => (
            <>
              <div className="font-medium text-gray-900">{post.en.title}</div>
              <div className="font-mono text-xs text-gray-400">{post.slug}</div>
            </>
          ),
        },
        {
          header: 'Czech',
          render: (post) => (Option.isSome(post.cs) ? 'Yes' : 'Missing'),
        },
        {
          header: 'Published on',
          render: (post) => formatDateTime(post.publishedAt),
        },
      ]}
    />
  )
}
