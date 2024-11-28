import dayjs from 'dayjs'
import 'dayjs/locale/bg'
import 'dayjs/locale/cs'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/it'
import 'dayjs/locale/ja'
import 'dayjs/locale/nl'
import 'dayjs/locale/pl'
import 'dayjs/locale/pt'
import 'dayjs/locale/sk'
import duration from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'
import {i18nAtom} from '../utils/localization/I18nProvider'

export function useSetRelativeDateFormatting(): void {
  const i18n = useAtomValue(i18nAtom)

  useEffect(() => {
    // setup dayjs
    dayjs.locale(i18n.locale === 'dev' ? 'en' : i18n.locale)
    dayjs.extend(relativeTime)
    dayjs.extend(localizedFormat)
    dayjs.extend(duration)
  }, [i18n.locale])
}
