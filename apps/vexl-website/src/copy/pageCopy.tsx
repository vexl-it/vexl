import {
  createPageCopy,
  type PageCopy as SharedPageCopy,
} from '@vexl-next/website-utils/src/pageCopy'
import {type Locale} from '../i18n/locales'
import {type CopyKey, type CopyPage, copyPages} from './copyFiles'

export {
  renderInlineCopy,
  type CopyMarker,
} from '@vexl-next/website-utils/src/pageCopy'

export type PageCopy<Page extends CopyPage> = SharedPageCopy<CopyKey<Page>>

export const pageCopy = <Page extends CopyPage>(
  locale: Locale,
  page: Page
): PageCopy<Page> => createPageCopy(page, copyPages[page][locale])
