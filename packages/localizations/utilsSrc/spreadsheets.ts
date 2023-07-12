import {google} from 'googleapis'
import {authorize} from './googleApiAuth'

interface TranslationItem {
  auto?: string | undefined
  human?: string | undefined
}

export type TranslationLang =
  | 'en'
  | 'cs'
  | 'sk'
  | 'de'
  | 'fr'
  | 'pt'
  | 'sp'
  | 'it'
type TranslationVariants = Partial<Record<TranslationLang, TranslationItem>>
export const LANGS = ['en', 'cs', 'sk', 'de', 'fr', 'it', 'pt', 'sp'] as const

export interface TranslationString {
  key: string
  variants: TranslationVariants
}

export async function getTranslations(): Promise<TranslationString[]> {
  const auth = await authorize()
  const sheets = google.sheets({version: 'v4', auth})
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!3:1000',
  })

  const rows = res.data.values
  if (!rows || rows.length === 0) {
    console.log('No data found.')
    throw new Error('No data found.')
  }

  // TODO iterate over LANGS array instead of hardcoding
  return rows.map((oneRow) => {
    const [
      key,
      enAuto,
      enHuman,
      csAuto,
      csHuman,
      skAuto,
      skHuman,
      deAuto,
      deHuman,
      itAuto,
      itHuman,
      frAuto,
      frHuman,
      spAuto,
      spHuman,
      ptAuto,
      ptHuman,
    ] = oneRow
    return {
      key,
      variants: {
        en: {auto: enAuto, human: enHuman},
        cs: {auto: csAuto, human: csHuman},
        sk: {auto: skAuto, human: skHuman},
        de: {auto: deAuto, human: deHuman},
        it: {auto: itAuto, human: itHuman},
        fr: {auto: frAuto, human: frHuman},
        sp: {auto: spAuto, human: spHuman},
        pt: {auto: ptAuto, human: ptHuman},
      },
    }
  })
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID

export async function addValuesToTable(
  value: TranslationString[]
): Promise<void> {
  const auth = await authorize()
  const sheets = google.sheets({version: 'v4', auth})

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!3:1000',
  })

  if (!res.data.values) {
    throw new Error('No data found.')
  }

  const startIndex = res.data.values.length + 3
  const rangeToInsert = `Sheet1!A${startIndex}:Q${startIndex + value.length}`

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeToInsert,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: value.map((one) => [
        `'${one.key}`,
        ...LANGS.map((lang) => {
          const langTranslation = one.variants[lang]

          return [
            langTranslation?.auto ? `'${langTranslation?.auto}` : null,
            langTranslation?.human ? `'${langTranslation?.human}` : null,
          ]
        }).flat(),
      ]),
    },
  })
}
