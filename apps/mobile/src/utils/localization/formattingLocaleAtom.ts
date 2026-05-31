import {atom} from 'jotai'
import {currentAppLanguageAtom} from '../preferences'
import {normalizeFormattingLocale} from './formatting'

export const formattingLocaleAtom = atom((get) =>
  normalizeFormattingLocale(get(currentAppLanguageAtom))
)
