import fs from 'node:fs'
import path from 'node:path'

const contentDir = path.join(process.cwd(), 'content')

export function readContentFile(...segments: readonly string[]): string {
  return fs.readFileSync(path.join(contentDir, ...segments), 'utf8')
}
