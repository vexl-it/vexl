import {google} from 'googleapis'
import {authorize} from './googleApiAuth'
import {DateTime} from 'luxon'

interface TranslationItem {
  auto?: string | undefined
  human?: string | undefined
}

export type TranslationLang = 'en' | 'cs' | 'sk'
type TranslationVariants = Partial<Record<TranslationLang, TranslationItem>>

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

  return rows.map((oneRow) => {
    const [key, enAuto, enHuman, csAuto, csHuman, skAuto, skHuman] = oneRow
    return {
      key,
      variants: {
        en: {auto: enAuto, human: enHuman},
        cs: {auto: csAuto, human: csHuman},
        sk: {auto: skAuto, human: skHuman},
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
  const rangeToInsert = `Sheet1!A${startIndex}:G${startIndex + value.length}`

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeToInsert,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: value.map((one) => [
        `'${one.key}`,
        one.variants.en?.auto ? `'${one.variants.en?.auto}` : null,
        one.variants.en?.human ? `'${one.variants.en?.human}` : null,
        one.variants.cs?.auto ? `'${one.variants.cs?.auto}` : null,
        one.variants.cs?.human ? `'${one.variants.cs?.human}` : null,
        one.variants.sk?.auto ? `'${one.variants.sk?.auto}` : null,
        one.variants.sk?.human ? `'${one.variants.sk?.human}` : null,
      ]),
    },
  })
}
