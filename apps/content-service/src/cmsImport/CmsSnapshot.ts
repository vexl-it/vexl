import {BlogPost, CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Schema} from 'effect'

export const CmsSnapshot = Schema.Struct({
  blogPosts: Schema.Array(BlogPost),
  events: Schema.Array(CmsEvent),
})
