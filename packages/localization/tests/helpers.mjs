import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const createdRoots = []

// spec: {locale: {fileNameWithoutExtension: objectOrRawString}}
export function makeLocaleTree(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vexl-l10n-test-'))
  createdRoots.push(root)

  for (const [locale, files] of Object.entries(spec)) {
    const localeDir = path.join(root, locale)
    fs.mkdirSync(localeDir, {recursive: true})
    for (const [fileName, content] of Object.entries(files)) {
      fs.writeFileSync(
        path.join(localeDir, `${fileName}.json`),
        typeof content === 'string'
          ? content
          : `${JSON.stringify(content, null, 2)}\n`
      )
    }
  }
  return root
}

export function cleanupLocaleTrees() {
  for (const root of createdRoots.splice(0)) {
    fs.rmSync(root, {recursive: true, force: true})
  }
}
