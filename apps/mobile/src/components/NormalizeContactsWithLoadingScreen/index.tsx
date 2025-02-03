import {useFocusEffect} from '@react-navigation/native'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect, useState} from 'react'
import {AppState} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import normalizeStoredContactsActionAtom from '../../state/contacts/atom/normalizeStoredContactsActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'
import WhiteContainer from '../WhiteContainer'

export default function NormalizeContactsWithLoadingScreen({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [state, setState] = useState<{
    progress?: {total: number; percentDone: number}
    done: boolean
  }>({done: false})
  const normalizeStoredContacts = useSetAtom(normalizeStoredContactsActionAtom)
  const {t} = useTranslation()

  const normalize = useCallback(() => {
    void normalizeStoredContacts({
      onProgress: ({total, percentDone}) => {
        setState({
          progress: {total, percentDone: Math.round(percentDone * 100)},
          done: false,
        })
      },
    })().then(() => {
      setState({done: true})
    })
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
      <WhiteContainer>
        <Stack alignItems="center" justifyContent="center" flex={1}>
          <VexlActivityIndicator
            size="large"
            bc={getTokens().color.main.val}
            description={
              state.progress ? t('contacts.loadingContacts') : undefined
            }
          />
        </Stack>
      </WhiteContainer>
    )
  }

  return <>{children}</>
}
