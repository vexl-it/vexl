import {useFocusEffect} from '@react-navigation/native'
import {Stack, Typography} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {Linking} from 'react-native'
import {areContactsPermissionsGranted} from '../../../../../state/contacts/utils'
import wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom from '../../../../../state/lastRouteMmkvAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import ContactsAccessPrivilegesInfoModal from './ContactsAccessPrivilegesInfoModal'

function ContactsListEmpty(): React.ReactElement {
  const {t} = useTranslation()
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  const setWasLastRouteBeforeRedirectOnContactsScreen = useSetAtom(
    wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
  )

  const checkPermissions = useCallback(async () => {
    setPermissionsGranted(
      await Effect.runPromise(areContactsPermissionsGranted())
    )
  }, [])

  useFocusEffect(
    useCallback(() => {
      void checkPermissions()
    }, [checkPermissions])
  )

  return (
    <EmptyListWrapper
      buttonText={!permissionsGranted ? t('common.allowNow') : undefined}
      onButtonPress={
        !permissionsGranted
          ? () => {
              void Linking.openSettings().then(() => {
                setWasLastRouteBeforeRedirectOnContactsScreen({
                  value: true,
                })
              })
            }
          : undefined
      }
    >
      <Stack gap="$2">
        <Typography
          textAlign="center"
          color="$foregroundPrimary"
          variant="titlesSmall"
        >
          {!permissionsGranted
            ? t('contacts.youHaveNotAllowedAccessToYourContacts')
            : t('postLoginFlow.contactsList.nothingFound.title')}
        </Typography>
        <Typography
          textAlign="center"
          color="$foregroundSecondary"
          variant="description"
        >
          {!permissionsGranted
            ? t('contacts.didYouChangeYourMind')
            : t('postLoginFlow.contactsList.nothingFound.text')}
        </Typography>
        <ContactsAccessPrivilegesInfoModal mt="$4" />
      </Stack>
    </EmptyListWrapper>
  )
}

export default ContactsListEmpty
