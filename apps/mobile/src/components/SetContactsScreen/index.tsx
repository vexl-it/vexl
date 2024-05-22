import fastDeepEqual from 'fast-deep-equal'
import {useAtomValue, useSetAtom} from 'jotai'
import {memo, useEffect} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from '../../state/lastRouteMmkvAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import closeSvg from '../images/closeSvg'
import ContactsListSelect from './components/ContactListSelect'

type Props = RootStackScreenProps<'SetContacts'>

function SetContactsScreen({route}: Props): JSX.Element {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const loadingContactsFromDevice = useAtomValue(loadingContactsFromDeviceAtom)
  const setWasLastRouteBeforeRedirectOnContactsScreen = useSetAtom(
    wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
  )

  useEffect(() => {
    setWasLastRouteBeforeRedirectOnContactsScreen({
      value: false,
    })
  }, [setWasLastRouteBeforeRedirectOnContactsScreen])

  return (
    <>
      <Screen>
        <KeyboardAvoidingView>
          <ScreenTitle p="$2" text={t('loginFlow.importContacts.action')}>
            <IconButton variant="dark" icon={closeSvg} onPress={goBack} />
          </ScreenTitle>
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
