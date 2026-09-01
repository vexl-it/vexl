import dayjs from 'dayjs'
import 'dayjs/locale/bg'
import 'dayjs/locale/cs'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ja'
import 'dayjs/locale/nl'
import 'dayjs/locale/pl'
import 'dayjs/locale/pt'
import 'dayjs/locale/sk'
import 'dayjs/locale/sw'
import 'dayjs/locale/zh'
import duration from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'
import {currentAppLanguageAtom} from '../utils/preferences'

export function useSetRelativeDateFormatting(): void {
  const language = useAtomValue(currentAppLanguageAtom)

  useEffect(() => {
    dayjs.locale(language)
    dayjs.extend(relativeTime)
    dayjs.extend(localizedFormat)
    dayjs.extend(duration)
  }, [language])
}
