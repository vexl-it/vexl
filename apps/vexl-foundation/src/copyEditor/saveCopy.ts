'use server'

import {
  type SaveCopyResult,
  writeCopy,
} from '@vexl-next/website-utils/src/copyEditor/writeCopy'
import path from 'node:path'
import {isCopyPage} from '../copy/copyFiles'

export async function saveCopy(input: unknown): Promise<SaveCopyResult> {
  return await writeCopy(input, {
    isPage: isCopyPage,
    locales: ['en'],
    file: (page) => path.join(process.cwd(), 'content', 'copy', `${page}.json`),
  })
}
