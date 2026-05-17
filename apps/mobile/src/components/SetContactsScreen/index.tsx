import {KeyboardAvoidingView, Screen, Stack, useTheme} from '@vexl-next/ui'
import {deepEqual} from 'fast-equals'
import {useAtomValue} from 'jotai'
import React, {memo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'
import ScreenTitle from '../ScreenTitle'
import ContactsListSelect from './components/ContactListSelect'

type Props = RootStackScreenProps<'SetContacts'>

function SetContactsScreen({route: {params}}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const loadingContactsFromDevice = useAtomValue(loadingContactsFromDeviceAtom)

  return (
    <Screen
      navigationBar={
        <ScreenTitle
          p="$2"
          text={t('loginFlow.importContacts.action')}
          withBackButton
        />
      }
      noHorizontalPadding
    >
      <KeyboardAvoidingView>
        <Stack testID="@setContactsScreen" f={1} mx="$2">
          {loadingContactsFromDevice ? (
            <Stack f={1} ai="center" jc="center">
              <VexlActivityIndicator
                size="large"
                bc={theme.accentYellowPrimary.get()}
              />
            </Stack>
          ) : (
            <ContactsListSelect filter={params?.filter} />
          )}
        </Stack>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default memo(SetContactsScreen, deepEqual)
