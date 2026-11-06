'use client'

import {BlogPostEditor} from '@/src/components/cms/BlogPostEditor'
import {useParams} from 'next/navigation'

export default function EditBlogPostPage() {
  const {id} = useParams<{id: string}>()
  return <BlogPostEditor id={id} />
}
