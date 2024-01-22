import {useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import ContactsListSelect from '../ContactListSelect'
import {newlyAddedCustomContactsAtom} from '../ContactListSelect/atom'
import IconButton from '../IconButton'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import closeSvg from '../images/closeSvg'

type Props = RootStackScreenProps<'SetContacts'>

function SetContactsScreen({
  route: {
    params: {showNew},
  },
}: Props): JSX.Element {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const setNewlyAddedCustomContacts = useSetAtom(newlyAddedCustomContactsAtom)

  const renderButton = useCallback(
    ({onSubmit}: {onSubmit: () => void}) => {
      return (
        <Stack mt="$2">
          <Button
            variant="secondary"
            onPress={onSubmit}
            fullWidth
            text={t('common.submit')}
          />
        </Stack>
      )
    },
    [t]
  )

  useEffect(() => {
    return () => {
      setNewlyAddedCustomContacts([])
    }
  }, [setNewlyAddedCustomContacts])

  return (
    <>
      <Screen>
        <KeyboardAvoidingView>
          <ScreenTitle p="$2" text={t('loginFlow.importContacts.action')}>
            <IconButton variant="dark" icon={closeSvg} onPress={goBack} />
          </ScreenTitle>
          <Stack f={1} mx="$2">
            <ContactsListSelect
              showFilter
              showNewByDefault={showNew ?? false}
              onContactsSubmitted={goBack}
              renderFooter={renderButton}
            />
          </Stack>
        </KeyboardAvoidingView>
      </Screen>
    </>
  )
}

export default SetContactsScreen
