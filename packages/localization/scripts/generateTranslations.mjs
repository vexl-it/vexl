import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const localesRoot = path.join(packageRoot, 'locales')
const defaultOutputRoot = path.join(packageRoot, 'src')

// App locales are bundled; extra locales are committed translations not enabled yet.
const APP_LOCALES = [
  ['en', '🇬🇧'],
  ['cs', '🇨🇿'],
  ['de', '🇩🇪'],
  ['fr', '🇫🇷'],
  ['it', '🇮🇹'],
  ['pt', '🇵🇹'],
  ['pl', '🇵🇱'],
  ['es', '🇪🇸'],
  ['sk', '🇸🇰'],
  ['bg', '🇧🇬'],
  ['ja', '🇯🇵'],
  ['nl', '🇳🇱'],
  ['sw', '🇰🇪'],
  ['zh', '🇨🇳'],
]
const EXTRA_LOCALES = [
  ['ar', '🇸🇦'],
  ['fa', '🇮🇷'],
  ['fi', '🇫🇮'],
  ['id', '🇮🇩'],
  ['no', '🇳🇴'],
  ['pcm', '🇳🇬'],
  ['sv', '🇸🇪'],
  ['tr', '🇹🇷'],
  ['uk', '🇺🇦'],
]

const HEADER =
  '// GENERATED FILE — do not edit. Regenerate with `pnpm generate` in packages/localization.'
const DOC_FILES = [
  'childSafetyAndSexAbusePrevention',
  'privacyPolicy',
  'termsOfUse',
]
const IGNORED_FILES = new Set([...DOC_FILES, 'infoPlist'])

function importName(locale, fileName) {
  return `${locale}${fileName[0].toUpperCase()}${fileName.slice(1)}`
}

function getResources(locale, requireAllDocs) {
  const localeDir = path.join(localesRoot, locale)
  const jsonFiles = fs
    .readdirSync(localeDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => path.basename(fileName, '.json'))
    .sort((left, right) => left.localeCompare(right))
  const groups = jsonFiles.filter((fileName) => !IGNORED_FILES.has(fileName))
  const docs = DOC_FILES.filter((fileName) => jsonFiles.includes(fileName))

  if (requireAllDocs && docs.length !== DOC_FILES.length) {
    throw new Error(`Missing document translations for ${locale}`)
  }

  return {docs, groups}
}

function renderImports(locales, resourcesByLocale) {
  return locales
    .flatMap(([locale]) => {
      const {docs, groups} = resourcesByLocale.get(locale)
      return [...groups, ...docs]
        .sort((left, right) => left.localeCompare(right))
        .map(
          (fileName) =>
            `import ${importName(locale, fileName)} from '../locales/${locale}/${fileName}.json'`
        )
    })
    .sort((left, right) => left.localeCompare(right))
    .join('\n')
}

function renderDocumentProperties(locale, docs) {
  const properties = []
  if (docs.includes('termsOfUse')) {
    properties.push(
      `  termsOfUseMD: ${importName(locale, 'termsOfUse')}.termsOfUseText,`
    )
  }
  if (docs.includes('privacyPolicy')) {
    properties.push(
      `  privacyPolicyMD: ${importName(locale, 'privacyPolicy')}.privacyPolicyText,`
    )
  }
  if (docs.includes('childSafetyAndSexAbusePrevention')) {
    properties.push(
      `  childAbusePrevention:\n    ${importName(locale, 'childSafetyAndSexAbusePrevention')}.childSafetyAndSexAbusePrevention,`
    )
  }
  return properties
}

function renderCatalog(name, locales) {
  const entries = locales.map(([locale]) => `  ${locale},`).join('\n')
  return `export const ${name} = {\n${entries}\n} as const`
}

function renderLocale(locale, flag, resources, includeFlag = true) {
  const lines = [`export const ${locale} = {`]
  if (includeFlag) lines.push(`  flag: '${flag}',`)
  lines.push(`  localeName: '${includeFlag ? locale : 'en_dev'}',`)
  lines.push(
    ...resources.groups.map((group) => `  ...${importName(locale, group)},`)
  )
  lines.push(...renderDocumentProperties(locale, resources.docs))
  lines.push('} as const')
  return lines.join('\n')
}

function generateAppTranslations() {
  const resourcesByLocale = new Map(
    APP_LOCALES.map(([locale]) => [locale, getResources(locale, true)])
  )
  const localeExports = APP_LOCALES.map(([locale, flag]) =>
    renderLocale(locale, flag, resourcesByLocale.get(locale))
  ).join('\n\n')
  const enResources = resourcesByLocale.get('en')
  const devExport = renderLocale('en', '', enResources, false).replace(
    'export const en =',
    'export const dev ='
  )

  return `${HEADER}\n\n${renderImports(APP_LOCALES, resourcesByLocale)}\n\n${localeExports}\n\n${devExport}\n\ntype PluralBaseKey<K> = K extends \`\${infer B}_one\` | \`\${infer B}_other\`\n  ? B\n  : never\nexport type TranslationKey = keyof typeof dev | PluralBaseKey<keyof typeof dev>\n${renderCatalog('appLocaleCatalogs', APP_LOCALES)}\nexport type AppLocale = keyof typeof appLocaleCatalogs\n`
}

function generateExtraTranslations() {
  const resourcesByLocale = new Map(
    EXTRA_LOCALES.map(([locale]) => [locale, getResources(locale, false)])
  )
  const localeExports = EXTRA_LOCALES.map(([locale, flag]) =>
    renderLocale(locale, flag, resourcesByLocale.get(locale))
  ).join('\n\n')

  return `${HEADER}\n\n${renderImports(EXTRA_LOCALES, resourcesByLocale)}\n\n${localeExports}\n\n${renderCatalog('extraLocaleCatalogs', EXTRA_LOCALES)}\n`
}

export function generateTranslations(outputRoot = defaultOutputRoot) {
  fs.mkdirSync(outputRoot, {recursive: true})
  fs.writeFileSync(
    path.join(outputRoot, 'translations.ts'),
    generateAppTranslations()
  )
  fs.writeFileSync(
    path.join(outputRoot, 'extraTranslations.ts'),
    generateExtraTranslations()
  )
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  generateTranslations()
}
