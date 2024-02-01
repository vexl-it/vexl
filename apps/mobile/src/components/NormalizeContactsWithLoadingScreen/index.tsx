import {useSetAtom} from 'jotai'
import {useEffect, useState} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, Text, getTokens} from 'tamagui'
import normalizeStoredContactsActionAtom from '../../state/contacts/atom/normalizeStoredContactsActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
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

  useEffect(() => {
    void normalizeStoredContacts({
      onProgress: ({total, percentDone}) => {
        setState({progress: {total, percentDone}, done: false})
      },
    })().then(() => {
      setState({done: true})
    })
  }, [setState, normalizeStoredContacts])

  if (!state.done) {
    return (
      <WhiteContainer>
        <Stack alignItems="center" justifyContent="center" flex={1}>
          <ActivityIndicator size="large" color={getTokens().color.main.val} />
          {!!state.progress && (
            <Text color="black">
              {t('contacts.loadingContacts', {
                percentDone: String(state.progress?.percentDone),
              })}
            </Text>
          )}
        </Stack>
      </WhiteContainer>
    )
  }

  return <>{children}</>
}
