import {readFileSync, writeFileSync} from 'node:fs'
import {getTranslations, type TranslationString} from './spreadsheets'
import {Parser} from '@json2csv/plainjs'

const NEWLINE_PLACEHOLDER = ' [[nn]] '
const TEMPLATE_REGEX = /{{\s*([^|}]+)\s*(?:\|[^}]+)?}}/g

function replaceTemplatesForOriginalOnes(
  original: string,
  translation: string
): string {
  const originalTemplates: string[] = original.match(TEMPLATE_REGEX) ?? []
  const translationTemplates: string[] = translation.match(/{{}}/g) ?? []

  if (originalTemplates.length !== translationTemplates.length) {
    throw new Error(
      `Template count mismatch. Original: ${original}, translation: ${translation}`
    )
  }

  return translationTemplates.reduce((acc, oneTemplate, index) => {
    return acc.replace(oneTemplate, originalTemplates[index])
  }, translation)
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function readFileAndReplaceTemplate(
  path: string,
  enTranslation: string[]
): string[] {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((oneLine, index) =>
      replaceTemplatesForOriginalOnes(enTranslation[index], oneLine)
        // replace newline placeholders with actual newlines
        .replace(new RegExp(escapeRegExp(NEWLINE_PLACEHOLDER), 'g'), '\n')
    )
}

export default async function newTranslation(): Promise<void> {
  const tableContent = await getTranslations()

  const keys = readFileSync('out/keys', 'utf-8').split('\n')
  const en = readFileSync('out/en', 'utf-8').split('\n')

  const de = readFileAndReplaceTemplate('out/de', en)
  const fr = readFileAndReplaceTemplate('out/fr', en)
  const it = readFileAndReplaceTemplate('out/it', en)
  const pt = readFileAndReplaceTemplate('out/pt', en)
  const sp = readFileAndReplaceTemplate('out/sp', en)

  const newContent = keys.map(
    (key, index): TranslationString => ({
      key,
      variants: {
        en: tableContent.find((one) => one.key === key)?.variants.en,
        cs: tableContent.find((one) => one.key === key)?.variants.cs,
        sk: tableContent.find((one) => one.key === key)?.variants.sk,
        de: {auto: de[index]},
        fr: {auto: fr[index]},
        it: {auto: it[index]},
        pt: {auto: pt[index]},
        sp: {auto: sp[index]},
      },
    })
  )

  const flatJson = newContent.map((oneValue) => ({
    key: oneValue.key,
    enAuto: oneValue.variants.en?.auto,
    enHuman: oneValue.variants.en?.human,
    csAuto: oneValue.variants.cs?.auto,
    csHuman: oneValue.variants.cs?.human,
    skAuto: oneValue.variants.sk?.auto,
    skHuman: oneValue.variants.sk?.human,
    deAuto: oneValue.variants.de?.auto,
    deHuman: oneValue.variants.de?.human,
    frAuto: oneValue.variants.fr?.auto,
    frHuman: oneValue.variants.fr?.human,
    itAuto: oneValue.variants.it?.auto,
    itHuman: oneValue.variants.it?.human,
    ptAuto: oneValue.variants.pt?.auto,
    ptHuman: oneValue.variants.pt?.human,
    spAuto: oneValue.variants.sp?.auto,
    spHuman: oneValue.variants.sp?.human,
  }))

  writeFileSync(
    'out/previousTranslations.json',
    JSON.stringify(tableContent, null, 2)
  )

  const parser = new Parser()
  const csv = parser.parse(flatJson)
  writeFileSync('out/translations.csv', csv)
}
