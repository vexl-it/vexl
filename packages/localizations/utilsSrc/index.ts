import 'dotenv/config'
import './sourcemapSupport'
import {
  addValuesToTable,
  getTranslations,
  type TranslationLang,
  type TranslationString,
} from './spreadsheets'
import {flattenObject, type JSONObject, unflattenObject} from './utils'
import {getTranslationJSON, writeTranslationJSON} from './translationFiles'
import {difference} from 'set-operations'

const IGNORE_VALUE = '[[ignore]]'

function getLang(
  translations: TranslationString[],
  lang: TranslationLang
): JSONObject {
  const langTranslations = translations.reduce((prev, curr) => {
    const value = (() => {
      // We want to replace empty values. Not just undefined
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const oneValue = curr.variants[lang]?.human || curr.variants[lang]?.auto
      if (oneValue === IGNORE_VALUE) return ''
      if (!oneValue) {
        console.warn(
          `value for ${curr.key}:${lang} does not exist. Fallback to en.`
        )
        // We want to replace empty values. Not just undefined
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return curr.variants.en?.human || curr.variants.en?.auto || ''
      }
      return oneValue
    })()

    return {
      ...prev,
      [curr.key]: value,
    }
  }, {})
  return unflattenObject(langTranslations)
}

function checkIfTranslationFilesAreInSync(): boolean {
  const fileContentEn = flattenObject(getTranslationJSON('en'))
  const fileContentCs = flattenObject(getTranslationJSON('cs'))
  const fileContentSK = flattenObject(getTranslationJSON('sk'))

  const missingKeys = Object.keys(fileContentEn).filter((enKey) => {
    if (fileContentCs[enKey] === undefined) {
      console.error(`Missing key ${enKey} in cs. Make sure to add it there`)
      return true
    }
    if (!fileContentSK[enKey] === undefined) {
      console.error(`Missing key ${enKey} in sk. Make sure to add it there`)
      return true
    }
    return false
  })

  if (missingKeys.length > 0) {
    console.error(
      `Missing keys in cs or sk. Please add them there first. Keys missing: ['${missingKeys.join(
        "','"
      )}']`
    )
    return false
  }
  return true
}

async function syncToTable(): Promise<void> {
  if (!checkIfTranslationFilesAreInSync()) {
    return
  }

  const fileContentEn = flattenObject(getTranslationJSON('en'))
  const fileContentCs = flattenObject(getTranslationJSON('cs'))
  const fileContentSK = flattenObject(getTranslationJSON('sk'))

  const tableContent = await getTranslations()
  const tableKeys = tableContent.map((one) => one.key)
  const fileKeys = Object.keys(fileContentEn)

  const newKeysInFile = difference(fileKeys, tableKeys)
  const valuesToAddToTable = newKeysInFile.map((key: string) => ({
    key,
    variants: {
      en: {human: fileContentEn[key]},
      cs: {human: fileContentCs[key]},
      sk: {human: fileContentSK[key]},
    },
  }))

  if (valuesToAddToTable.length > 0) {
    console.log('Adding following keys to the table')
  }

  await addValuesToTable(valuesToAddToTable)
}

async function syncFromTable(): Promise<void> {
  if (!checkIfTranslationFilesAreInSync()) {
    return
  }
  const tableContent = await getTranslations()
  const tableKeys = tableContent.map((one) => one.key)

  const fileContentEn = flattenObject(getTranslationJSON('en'))
  const enKeys = Object.keys(fileContentEn)

  if (difference(enKeys, tableKeys).length > 0) {
    console.error('Missing keys in the table. Please add them there first')
    return
  }

  const en = getLang(tableContent, 'en')
  const cs = getLang(tableContent, 'cs')
  const sk = getLang(tableContent, 'sk')

  writeTranslationJSON('en', JSON.stringify(en, null, 2))
  writeTranslationJSON('cs', JSON.stringify(cs, null, 2))
  writeTranslationJSON('sk', JSON.stringify(sk, null, 2))
}

const SYNC_OUT_COMMAND = 'out'
const SYNC_IN_COMMAND = 'in'

async function main(): Promise<void> {
  const command = process.argv[2]
  if (command === SYNC_IN_COMMAND) {
    await syncFromTable()
  } else if (command === SYNC_OUT_COMMAND) {
    await syncToTable()
  } else {
    console.log('No command specified. Syncing both ways')
    await syncToTable()
    await syncFromTable()
  }

  console.log('Done')
}

void main()
