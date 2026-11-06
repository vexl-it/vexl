'use client'

import {blogPostResource} from '@/src/services/cms/resources'
import {BlogPostForm} from './BlogPostForm'
import {CmsEditor} from './CmsEditor'

export function BlogPostEditor({id}: {readonly id: string | null}) {
  return (
    <CmsEditor
      resource={blogPostResource}
      id={id}
      title={id === null ? 'New blog post' : 'Edit blog post'}
      renderForm={(props) => <BlogPostForm {...props} />}
    />
  )
}
