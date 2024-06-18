import fastDeepEqual from 'fast-deep-equal'
import {useAtomValue} from 'jotai'
import {memo} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import ContactsListSelect from './components/ContactListSelect'

type Props = RootStackScreenProps<'SetContacts'>

function SetContactsScreen({route}: Props): JSX.Element {
  const {t} = useTranslation()
  const loadingContactsFromDevice = useAtomValue(loadingContactsFromDeviceAtom)

  return (
    <>
      <Screen>
        <KeyboardAvoidingView>
          <ScreenTitle
            p="$2"
            text={t('loginFlow.importContacts.action')}
            withBackButton
          />
          <Stack f={1} mx="$2">
            {loadingContactsFromDevice ? (
              <Stack f={1} ai="center" jc="center">
                <ActivityIndicator
                  size="large"
                  color={getTokens().color.main.val}
                />
              </Stack>
            ) : (
              <ContactsListSelect />
            )}
          </Stack>
        </KeyboardAvoidingView>
      </Screen>
    </>
  )
}

export default memo(SetContactsScreen, fastDeepEqual)
