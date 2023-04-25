import type {TranslateOptions} from 'i18n-js'
import i18n, {type LocaleKeys} from './i18n'
import {atom, useAtomValue} from 'jotai'

export type TFunction = (key: LocaleKeys, options?: TranslateOptions) => string

interface TranslationContext {
  t: TFunction
}

export const translationAtom = atom<TranslationContext>({t: i18n.t.bind(i18n)})

export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}
