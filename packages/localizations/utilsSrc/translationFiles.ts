import * as fs from 'node:fs'
import path from 'node:path'

const translationFilePaths = {
  en: path.resolve(__dirname, '../src/chunks/other.en.ts'),
  cs: path.resolve(__dirname, '../src/chunks/other.cs.ts'),
  sk: path.resolve(__dirname, '../src/chunks/other.sk.ts'),
}

function getContent(str: string): string {
  const regex = /\/\* JSON starts \*\/\n([\s\S]*?)\n\/\* JSON ends \*\//
  const match = str.match(regex)
  return match?.[1] ? match[1].trim() : ''
}

function replaceInside(content: string, toReplaceWith: string): string {
  const regex = /\/\* JSON starts \*\/\n([\s\S]*?)\n\/\* JSON ends \*\//
  return content.replace(
    regex,
    `/* JSON starts */\n${toReplaceWith}\n/* JSON ends */`
  )
}

export function getTranslationJSON(
  lang: keyof typeof translationFilePaths
): Record<string, any> {
  return JSON.parse(
    getContent(fs.readFileSync(translationFilePaths[lang], 'utf8'))
  )
}

export function writeTranslationJSON(
  lang: keyof typeof translationFilePaths,
  content: string
): void {
  const newContent = replaceInside(
    fs.readFileSync(translationFilePaths[lang], 'utf8'),
    content
  )

  fs.writeFileSync(translationFilePaths[lang], newContent)
}
