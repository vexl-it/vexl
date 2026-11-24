'use server'

import {
  type SaveCopyResult,
  writeCopy,
} from '@vexl-next/website-utils/src/copyEditor/writeCopy'
import path from 'node:path'
import {isCopyPage} from '../copy/copyFiles'
import {locales} from '../i18n/locales'

export async function saveCopy(input: unknown): Promise<SaveCopyResult> {
  return await writeCopy(input, {
    isPage: isCopyPage,
    locales,
    file: (page, locale) =>
      path.join(process.cwd(), 'content', 'copy', locale, `${page}.json`),
  })
}
