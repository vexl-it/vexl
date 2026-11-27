import {
  AddUserPersonContact,
  ChevronLeft,
  NavigationBar,
  Screen,
  Stack,
} from '@vexl-next/ui'
import {deepEqual} from 'fast-equals'
import {useAtomValue} from 'jotai'
import React, {memo, useCallback, useEffect, useState} from 'react'
import {type ContactPreferencesStackScreenProps} from '../../navigationTypes'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {runAfterAnimationFrame} from '../../utils/runAfterAnimationFrames'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ContactsListSelect from './components/ContactListSelect'
import PreparingContactsOverlay from './components/PreparingContactsOverlay'

type Props = ContactPreferencesStackScreenProps<'ContactPreferencesList'>

function ContactPreferencesNavigationBar({
  loading,
  navigation,
}: {
  readonly loading: boolean
  readonly navigation: Props['navigation']
}): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  return (
    <NavigationBar
      style="back"
      title={t('contactPreferences.title')}
      leftAction={
        loading ? undefined : {icon: ChevronLeft, onPress: safeGoBack}
      }
      rightActions={
        loading
          ? undefined
          : [
              {
                icon: AddUserPersonContact,
                onPress: () => {
                  navigation.navigate('AddNewContact')
                },
              },
            ]
      }
    />
  )
}

function ContactPreferencesContent({
  onReady,
}: {
  readonly onReady: () => void
}): React.ReactElement {
  useEffect(() => {
    return runAfterAnimationFrame(onReady)
  }, [onReady])

  return <ContactsListSelect addContactRequestId={0} />
}

function ContactPreferencesListScreen({navigation}: Props): React.ReactElement {
  const loadingContactsFromDevice = useAtomValue(loadingContactsFromDeviceAtom)
  const [shouldRenderContactsContent, setShouldRenderContactsContent] =
    useState(false)
  const [isContactsContentReady, setIsContactsContentReady] = useState(false)
  const isContactPreferencesLoading =
    loadingContactsFromDevice || !isContactsContentReady

  const handleContactsContentReady = useCallback(() => {
    setIsContactsContentReady(true)
  }, [])

  useEffect(() => {
    return runAfterAnimationFrame(() => {
      setShouldRenderContactsContent(true)
    })
  }, [])

  return (
    <Screen
      navigationBar={
        <ContactPreferencesNavigationBar
          loading={isContactPreferencesLoading}
          navigation={navigation}
        />
      }
      noHorizontalPadding
    >
      <Stack f={1} testID="@contactPreferences" bg="$backgroundPrimary">
        {shouldRenderContactsContent ? (
          <ContactPreferencesContent onReady={handleContactsContentReady} />
        ) : null}
        <PreparingContactsOverlay visible={isContactPreferencesLoading} />
      </Stack>
    </Screen>
  )
}

export default memo(ContactPreferencesListScreen, deepEqual)
