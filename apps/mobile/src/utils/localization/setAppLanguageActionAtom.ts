import {atom} from 'jotai'
import {loadingOverlayDisplayedAtom} from '../../components/LoadingOverlayProvider'
import {appLanguageFromPreferencesAtom} from '../preferences'
import {
  runAfterAnimationFrame,
  runAfterTwoAnimationFrames,
} from '../runAfterAnimationFrames'

// Committing a language change recreates the i18n instance and re-renders the
// whole app synchronously. Paint the loading overlay first, commit the write a
// frame later, and lift the overlay once the re-render has committed.
export const setAppLanguageActionAtom = atom(
  null,
  (
    get,
    set,
    {
      language,
      onDone,
    }: {readonly language: string; readonly onDone?: () => void}
  ) => {
    if (get(appLanguageFromPreferencesAtom) === language) {
      onDone?.()
      return
    }

    set(loadingOverlayDisplayedAtom, true)
    runAfterAnimationFrame(() => {
      set(appLanguageFromPreferencesAtom, language)
      runAfterTwoAnimationFrames(() => {
        set(loadingOverlayDisplayedAtom, false)
        onDone?.()
      })
    })
  }
)
