import fastDeepEqual from 'fast-deep-equal'
import {useAtomValue} from 'jotai'
import {memo} from 'react'
import {Stack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import ContactsListSelect from './components/ContactListSelect'

type Props = RootStackScreenProps<'SetContacts'>

function SetContactsScreen({route: {params}}: Props): JSX.Element {
  const {t} = useTranslation()
  const loadingContactsFromDevice = useAtomValue(loadingContactsFromDeviceAtom)

  return (
    <>
      <Screen testID="@setContactsScreen">
        <KeyboardAvoidingView>
          <ScreenTitle
            p="$2"
            text={t('loginFlow.importContacts.action')}
            withBackButton
          />
          <Stack f={1} mx="$2">
            {loadingContactsFromDevice ? (
              <Stack f={1} ai="center" jc="center">
                <VexlActivityIndicator
                  size="large"
                  bc={getTokens().color.main.val}
                />
              </Stack>
            ) : (
              <ContactsListSelect filter={params?.filter} />
            )}
          </Stack>
        </KeyboardAvoidingView>
      </Screen>
    </>
  )
}

export default memo(SetContactsScreen, fastDeepEqual)
