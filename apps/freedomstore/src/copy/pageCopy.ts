import {
  createPageCopy,
  type PageCopy as SharedPageCopy,
} from '@vexl-next/website-utils/src/pageCopy'
import {type CopyKey, type CopyPage, copyPages} from './copyFiles'

export type PageCopy<Page extends CopyPage> = SharedPageCopy<CopyKey<Page>>

export const pageCopy = <Page extends CopyPage>(page: Page): PageCopy<Page> =>
  createPageCopy(page, copyPages[page])
