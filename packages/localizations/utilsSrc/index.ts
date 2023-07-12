import 'dotenv/config'
import './sourcemapSupport'
import {
  addValuesToTable,
  getTranslations,
  LANGS,
  type TranslationLang,
  type TranslationString,
} from './spreadsheets'
import {flattenObject, type JSONObject, unflattenObject} from './utils'
import {getTranslationJSON, writeTranslationJSON} from './translationFiles'
import {difference} from 'set-operations'
import readline from 'node:readline/promises'
import {stdin as input, stdout as output} from 'node:process'

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
      `Missing keys in translation files. Please add them there first. Keys missing: ['${missingKeys.join(
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

  const fileContents = LANGS.map((lang) => ({
    lang,
    contents: flattenObject(getTranslationJSON(lang)),
  }))

  const fileContentEn = flattenObject(getTranslationJSON('en'))

  const tableContent = await getTranslations()
  const tableKeys = tableContent.map((one) => one.key)
  const fileKeys = Object.keys(fileContentEn)

  const newKeysInFile = difference(fileKeys, tableKeys)
  const valuesToAddToTable: TranslationString[] = newKeysInFile.map(
    (key: string) => ({
      key,
      variants: fileContents.reduce(
        (prev, curr) => ({...prev, [curr.lang]: {auto: curr.contents[key]}}),
        {}
      ),
    })
  )

  if (valuesToAddToTable.length > 0) {
    console.log(
      `Adding following keys to the table: ${valuesToAddToTable
        .map((one) => one.key)
        .join(', ')}`
    )
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

  LANGS.forEach((langKey) => {
    const translations = getLang(tableContent, langKey)
    writeTranslationJSON(langKey, JSON.stringify(translations, null, 2))
  })
}

function addTranslation(key: string, enValue: string): void {
  LANGS.forEach((langKey) => {
    console.log(`Adding to ${langKey}`)
    const existingTranslations = flattenObject(getTranslationJSON(langKey))

    if (existingTranslations[key]) {
      console.log(`There is already translations for key ${key} in ${langKey}`)
      return
    }

    existingTranslations[key] = enValue
    writeTranslationJSON(
      langKey,
      JSON.stringify(unflattenObject(existingTranslations), null, 2)
    )
  })
  console.log('Done')
}

const SYNC_OUT_COMMAND = 'out'
const SYNC_IN_COMMAND = 'in'
const ADD_TRANSLATION = 'add-translation'

async function main(): Promise<void> {
  const command = process.argv[2]
  // await newTranslation()

  if (command === ADD_TRANSLATION) {
    const readlineInterface = readline.createInterface({input, output})
    try {
      const key = await readlineInterface.question('Type key: ')
      const value = await readlineInterface.question('Type value: ')
      if (!key || !value)
        throw new Error(
          'Key or value are null. Please make sure to type both of them.'
        )
      addTranslation(key, value)
    } finally {
      readlineInterface.close()
    }
  } else if (command === SYNC_IN_COMMAND) {
    await syncFromTable()
  } else if (command === SYNC_OUT_COMMAND) {
    await syncToTable()
  } else {
    console.log('No command specified. Syncing both ways.')
    await syncToTable()
    await syncFromTable()
  }

  console.log('Done')
}

void main()
