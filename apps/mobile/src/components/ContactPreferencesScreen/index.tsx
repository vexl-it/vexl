import {
  AddUserPersonContact,
  ChevronLeft,
  NavigationBar,
  Screen,
  Stack,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array} from 'effect'
import {deepEqual} from 'fast-equals'
import {atom, useAtomValue} from 'jotai'
import React, {memo, useCallback, useEffect, useState} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {normalizedContactsAtom} from '../../state/contacts/atom/contactsStore'
import {loadingContactsFromDeviceAtom} from '../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import {
  type ContactsFilter,
  type StoredContactWithComputedValues,
} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ContactsListSelect from './components/ContactListSelect'
import ContactPreferencesLoadingOverlay from './components/ContactPreferencesLoadingOverlay'

type Props = RootStackScreenProps<'ContactPreferences'>

const emptyNormalizedContactsAtom = atom<StoredContactWithComputedValues[]>([])

function ContactPreferencesNavigationBar({
  loading,
  navigation,
}: {
  readonly loading: boolean
  readonly navigation: Props['navigation']
}): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const normalizedContacts = useAtomValue(
    loading ? emptyNormalizedContactsAtom : normalizedContactsAtom
  )
  const isShowingEmptyContactsHeader =
    !Array.isNonEmptyArray(normalizedContacts)

  return (
    <NavigationBar
      style="back"
      title={t('contactPreferences.title')}
      leftAction={
        !loading && isShowingEmptyContactsHeader
          ? undefined
          : {icon: ChevronLeft, onPress: safeGoBack}
      }
      rightActions={
        loading
          ? undefined
          : [
              {
                icon: isShowingEmptyContactsHeader
                  ? XmarkCancelClose
                  : AddUserPersonContact,
                onPress: () => {
                  if (isShowingEmptyContactsHeader) {
                    safeGoBack()
                  } else {
                    navigation.navigate('AddNewContact')
                  }
                },
              },
            ]
      }
    />
  )
}

function ContactPreferencesContent({
  filter,
  onReady,
}: {
  readonly filter?: ContactsFilter
  readonly onReady: () => void
}): React.ReactElement {
  useEffect(() => {
    const readyFrame = requestAnimationFrame(onReady)

    return () => {
      cancelAnimationFrame(readyFrame)
    }
  }, [onReady])

  return <ContactsListSelect addContactRequestId={0} filter={filter} />
}

function ContactPreferencesScreen({
  navigation,
  route: {params},
}: Props): React.ReactElement {
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
    const contentMountFrame = requestAnimationFrame(() => {
      setShouldRenderContactsContent(true)
    })

    return () => {
      cancelAnimationFrame(contentMountFrame)
    }
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
          <ContactPreferencesContent
            filter={params?.filter}
            onReady={handleContactsContentReady}
          />
        ) : null}
        <ContactPreferencesLoadingOverlay
          visible={isContactPreferencesLoading}
        />
      </Stack>
    </Screen>
  )
}

export default memo(ContactPreferencesScreen, deepEqual)
