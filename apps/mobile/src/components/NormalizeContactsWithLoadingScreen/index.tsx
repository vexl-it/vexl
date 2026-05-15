import {useFocusEffect} from '@react-navigation/native'
import {Stack, useTheme} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {AppState} from 'react-native'
import normalizeStoredContactsActionAtom from '../../state/contacts/atom/normalizeStoredContactsActionAtom'
import {andThenExpectVoidNoErrors} from '../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../utils/localization/I18nProvider'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'

const BACKGROUND_OPACITY = 0.86

export default function NormalizeContactsWithLoadingScreen({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const [state, setState] = useState<{
    progress?: {total: number; percentDone: number}
    done: boolean
  }>({done: false})
  const normalizeStoredContacts = useSetAtom(normalizeStoredContactsActionAtom)
  const {t} = useTranslation()
  const theme = useTheme()

  const normalize = useCallback(() => {
    void Effect.runPromise(
      andThenExpectVoidNoErrors(() => {
        setState((prev) => (prev.done ? prev : {done: true}))
      })(
        normalizeStoredContacts({
          onProgress: ({total, percentDone}) => {
            setState({
              progress: {total, percentDone: Math.round(percentDone * 100)},
              done: false,
            })
          },
        })
      )
    )
  }, [normalizeStoredContacts])

  useEffect(() => {
    const listener = AppState.addEventListener('change', (event) => {
      if (event === 'active') normalize()
    })

    return () => {
      listener.remove()
    }
  }, [normalize])

  useFocusEffect(normalize)

  if (!state.done) {
    return (
      <Stack f={1} ai="center" jc="center" bg="$backgroundSecondary">
        <Stack
          pos="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          bg={theme.backgroundPrimary.get()}
          opacity={BACKGROUND_OPACITY}
        />
        <VexlActivityIndicator
          size="large"
          bc={theme.accentYellowPrimary.get()}
          description={
            state.progress ? t('contacts.preparingContacts') : undefined
          }
        />
      </Stack>
    )
  }

  return <>{children}</>
}
